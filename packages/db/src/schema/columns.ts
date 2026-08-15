import { text, timestamp } from "drizzle-orm/pg-core";

/** Colonnes d'audit présentes sur toutes les tables. `*_by` porte l'identifiant Clerk. */
export function auditColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  };
}
