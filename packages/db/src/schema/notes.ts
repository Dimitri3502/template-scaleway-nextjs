import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { auditColumns } from "./columns";
import { users } from "./users";

/**
 * Table de démonstration. `ownerId` est la colonne d'appartenance : toute requête sur
 * `notes` porte le prédicat `eq(notes.ownerId, moi)`. Voir docs/REMOVE-DEMO.md pour la retirer.
 */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    ...auditColumns(),
  },
  (table) => [index("notes_owner_created_idx").on(table.ownerId, table.createdAt)],
);

export type NoteRow = typeof notes.$inferSelect;
export type NewNoteRow = typeof notes.$inferInsert;
