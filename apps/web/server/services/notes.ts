import "server-only";

import { and, attachments, desc, eq, getDb, notes } from "@acme/db";
import { NotFoundError } from "@acme/shared";

import { auditInsert, recordAuditEvent } from "../auth/audit";

export interface NoteSummary {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
}

export interface NoteAttachment {
  readonly id: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface NoteDetail extends NoteSummary {
  readonly body: string;
  readonly attachments: readonly NoteAttachment[];
}

/**
 * Le prédicat d'appartenance `eq(notes.ownerId, ownerId)` est porté par **chaque** requête,
 * lectures comme écritures. Une requête qui l'oublie expose les données d'autrui : c'est
 * l'invariant le plus important du socle.
 */
export async function listNotes(ownerId: string): Promise<NoteSummary[]> {
  return getDb()
    .select({ id: notes.id, title: notes.title, createdAt: notes.createdAt })
    .from(notes)
    .where(eq(notes.ownerId, ownerId))
    .orderBy(desc(notes.createdAt));
}

export async function getNote(ownerId: string, noteId: string): Promise<NoteDetail> {
  const [note] = await getDb()
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.ownerId, ownerId)));

  if (!note) throw new NotFoundError("Note not found");

  const rows = await getDb()
    .select({
      id: attachments.id,
      originalFilename: attachments.originalFilename,
      mimeType: attachments.mimeType,
      size: attachments.size,
    })
    .from(attachments)
    .where(eq(attachments.noteId, noteId))
    .orderBy(desc(attachments.createdAt));

  return { ...note, attachments: rows };
}

export async function createNote(input: {
  ownerId: string;
  clerkUserId: string;
  title: string;
  body: string;
}): Promise<string> {
  const [row] = await getDb()
    .insert(notes)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      body: input.body,
      ...auditInsert(input.clerkUserId),
    })
    .returning({ id: notes.id });

  if (!row) throw new Error("Failed to create note");

  recordAuditEvent("note.created", { userId: input.ownerId, noteId: row.id });
  return row.id;
}

export async function deleteNote(ownerId: string, noteId: string): Promise<void> {
  const deleted = await getDb()
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.ownerId, ownerId)))
    .returning({ id: notes.id });

  if (deleted.length === 0) throw new NotFoundError("Note not found");
  recordAuditEvent("note.deleted", { userId: ownerId, noteId });
}

/** Vérifie l'appartenance sans charger la note entière. */
export async function assertNoteOwnership(ownerId: string, noteId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.ownerId, ownerId)));

  if (!row) throw new NotFoundError("Note not found");
}
