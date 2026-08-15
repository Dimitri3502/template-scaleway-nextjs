"use server";

import type { ActionState } from "@acme/shared";
import { successState } from "@acme/shared";
import { revalidatePath } from "next/cache";

import { getTranslations } from "../../i18n";
import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from "../../lib/notes-constraints";
import { routes } from "../../routes";
import { requireUser } from "../auth/access-context";
import { runAction } from "../run-action";
import { confirmUpload } from "../services/attachments";
import { createNote, deleteNote } from "../services/notes";
import { optionalString, requiredString } from "../validation/form";

/**
 * Une action valide le `FormData`, appelle un service, revalide, et renvoie un `ActionState`.
 * Aucune requête Drizzle ici : c'est le contrat de couches.
 */
export async function createNoteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const t = getTranslations();
    const user = await requireUser();

    const title = requiredString(formData, "title", NOTE_TITLE_MAX_LENGTH);
    const body = optionalString(formData, "body", NOTE_BODY_MAX_LENGTH);

    await createNote({ ownerId: user.id, clerkUserId: user.clerkUserId, title, body });

    revalidatePath(routes.app);
    return successState(t("notes.created"));
  });
}

export async function deleteNoteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const t = getTranslations();
    const user = await requireUser();
    const noteId = requiredString(formData, "noteId", 64);

    await deleteNote(user.id, noteId);

    revalidatePath(routes.app);
    return successState(t("notes.deleted"));
  });
}

/** Confirme un envoi direct navigateur → S3 : la clé est recalculée côté serveur. */
export async function confirmAttachmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const t = getTranslations();
    const user = await requireUser();

    const noteId = requiredString(formData, "noteId", 64);
    const attachmentId = requiredString(formData, "attachmentId", 64);
    const objectKey = requiredString(formData, "objectKey", 512);
    const originalFilename = requiredString(formData, "originalFilename", 255);
    const mimeType = requiredString(formData, "mimeType", 128);
    const size = Number(requiredString(formData, "size", 16));

    await confirmUpload({
      ownerId: user.id,
      clerkUserId: user.clerkUserId,
      noteId,
      attachmentId,
      objectKey,
      originalFilename,
      mimeType,
      size,
    });

    revalidatePath(routes.note(noteId));
    return successState(t("notes.attachments.added"));
  });
}
