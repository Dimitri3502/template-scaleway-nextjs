import { pgTable, text, uuid } from "drizzle-orm/pg-core";

import { auditColumns } from "./columns";

/**
 * Miroir applicatif du compte Clerk. Clerk reste la source de vérité de l'identité ;
 * cette table n'existe que pour porter les clés étrangères et les données propres au produit.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  ...auditColumns(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
