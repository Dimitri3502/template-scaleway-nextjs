import { relations } from "drizzle-orm";

import { attachments } from "./attachments";
import { notes } from "./notes";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ many, one }) => ({
  owner: one(users, { fields: [notes.ownerId], references: [users.id] }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  note: one(notes, { fields: [attachments.noteId], references: [notes.id] }),
}));
