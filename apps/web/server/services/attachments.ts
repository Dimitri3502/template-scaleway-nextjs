import "server-only";

import { and, attachments, eq, getDb, notes } from "@acme/db";
import {
  AttachmentTooLargeError,
  ForbiddenError,
  isAcceptedMimeType,
  NotFoundError,
  slugifyFileName,
  UnsupportedMimeTypeError,
  uploadConstraintFor,
} from "@acme/shared";
import {
  assertKeyBelongsTo,
  buildObjectKey,
  createDownloadUrl,
  createUploadUrl,
} from "@acme/storage";
import { randomUUID } from "node:crypto";

import { auditInsert, recordAuditEvent } from "../auth/audit";
import { assertNoteOwnership } from "./notes";

/** Préfixe des clés S3 de cette verticale. Changez-le en même temps que la table propriétaire. */
const SCOPE = "notes";

export interface PreparedUpload {
  readonly attachmentId: string;
  readonly objectKey: string;
  readonly uploadUrl: string;
}

/**
 * Le client n'annonce qu'un nom, un type MIME et une taille. L'identifiant et la clé sont
 * générés ici, jamais reçus — et la clé est recalculée à la confirmation pour être comparée.
 */
export async function prepareUpload(input: {
  ownerId: string;
  noteId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}): Promise<PreparedUpload> {
  await assertNoteOwnership(input.ownerId, input.noteId);

  if (!isAcceptedMimeType(input.mimeType)) throw new UnsupportedMimeTypeError(input.mimeType);

  const constraint = uploadConstraintFor(input.mimeType);
  if (input.size <= 0 || input.size > constraint.maxBytes) {
    throw new AttachmentTooLargeError(constraint.maxBytes);
  }

  const attachmentId = randomUUID();
  const objectKey = buildObjectKey({
    scope: SCOPE,
    resourceId: input.noteId,
    attachmentId,
    slug: slugifyFileName(input.originalFilename),
    extension: constraint.extension,
  });

  const uploadUrl = await createUploadUrl({
    objectKey,
    mimeType: input.mimeType,
    size: input.size,
  });

  return { attachmentId, objectKey, uploadUrl };
}

/** Deuxième temps : la clé annoncée est recalculée et comparée avant d'être persistée. */
export async function confirmUpload(input: {
  ownerId: string;
  clerkUserId: string;
  noteId: string;
  attachmentId: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}): Promise<void> {
  await assertNoteOwnership(input.ownerId, input.noteId);
  assertKeyBelongsTo(input.objectKey, SCOPE, input.noteId);

  if (!isAcceptedMimeType(input.mimeType)) throw new UnsupportedMimeTypeError(input.mimeType);

  const expectedKey = buildObjectKey({
    scope: SCOPE,
    resourceId: input.noteId,
    attachmentId: input.attachmentId,
    slug: slugifyFileName(input.originalFilename),
    extension: uploadConstraintFor(input.mimeType).extension,
  });

  if (expectedKey !== input.objectKey) {
    throw new ForbiddenError("Object key does not match the expected one");
  }

  await getDb()
    .insert(attachments)
    .values({
      id: input.attachmentId,
      noteId: input.noteId,
      objectKey: input.objectKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      size: input.size,
      ...auditInsert(input.clerkUserId),
    });

  recordAuditEvent("attachment.uploaded", {
    userId: input.ownerId,
    noteId: input.noteId,
    attachmentId: input.attachmentId,
  });
}

/** URL de lecture signée, à durée courte. Le bucket reste privé : aucune URL permanente. */
export async function createAttachmentAccessUrl(
  ownerId: string,
  attachmentId: string,
): Promise<string> {
  const [row] = await getDb()
    .select({
      objectKey: attachments.objectKey,
      originalFilename: attachments.originalFilename,
      mimeType: attachments.mimeType,
      noteId: attachments.noteId,
    })
    .from(attachments)
    .innerJoin(notes, eq(notes.id, attachments.noteId))
    .where(and(eq(attachments.id, attachmentId), eq(notes.ownerId, ownerId)));

  if (!row) throw new NotFoundError("Attachment not found");

  recordAuditEvent("attachment.accessed", { userId: ownerId, attachmentId, noteId: row.noteId });

  return createDownloadUrl({
    objectKey: row.objectKey,
    mimeType: row.mimeType,
    originalFilename: row.originalFilename,
  });
}
