import { Card } from "@acme/ui";
import { notFound } from "next/navigation";

import { AppHeader } from "../../../../components/layout/app-header";
import { AttachmentList } from "../../../../components/notes/attachment-list";
import { AttachmentPicker } from "../../../../components/notes/attachment-picker";
import { DeleteNoteButton } from "../../../../components/notes/delete-note-button";
import { getTranslations } from "../../../../i18n";
import { requireUser } from "../../../../server/auth/access-context";
import { getNote } from "../../../../server/services/notes";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const t = getTranslations();
  const { noteId } = await params;
  const user = await requireUser();

  const note = await getNote(user.id, noteId).catch(() => null);
  if (!note) notFound();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface">
      <AppHeader title={note.title} />

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-safe-bottom">
        {note.body.length > 0 ? (
          <Card className="p-4">
            <p className="whitespace-pre-wrap text-base text-ink">{note.body}</p>
          </Card>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink-muted">{t("notes.attachments.title")}</h2>
          <AttachmentList attachments={note.attachments} />
          <AttachmentPicker noteId={note.id} />
        </section>

        <DeleteNoteButton noteId={note.id} />
      </main>
    </div>
  );
}
