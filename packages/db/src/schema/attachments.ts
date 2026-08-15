import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { auditColumns } from "./columns";
import { notes } from "./notes";

/**
 * `objectKey` est unique et généré par le serveur : le client ne choisit jamais une clé S3.
 * Le binaire ne transite pas par l'application, seule la métadonnée est persistée ici.
 */
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    ...auditColumns(),
  },
  (table) => [index("attachments_note_idx").on(table.noteId)],
);

export type AttachmentRow = typeof attachments.$inferSelect;
export type NewAttachmentRow = typeof attachments.$inferInsert;
