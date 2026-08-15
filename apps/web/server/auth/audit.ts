import "server-only";

/** Colonnes d'audit renseignées à l'écriture. */
export function auditInsert(clerkUserId: string) {
  return { createdBy: clerkUserId, updatedBy: clerkUserId };
}

export function auditUpdate(clerkUserId: string) {
  return { updatedAt: new Date(), updatedBy: clerkUserId };
}

export type AuditEvent =
  | "user.signed_in"
  | "note.created"
  | "note.deleted"
  | "attachment.uploaded"
  | "attachment.accessed";

interface AuditContext {
  readonly userId?: string;
  readonly noteId?: string;
  readonly attachmentId?: string;
}

/**
 * Piste d'audit minimale : uniquement des identifiants et un horodatage. Jamais de contenu,
 * jamais un nom de fichier, jamais une URL signée — une ligne de log ne doit rien divulguer.
 */
export function recordAuditEvent(event: AuditEvent, context: AuditContext): void {
  const entry = { event, ...context, at: new Date().toISOString() };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}
