import "server-only";

import { eq, getDb, users } from "@acme/db";

import { auditInsert, auditUpdate } from "../auth/audit";

export interface AppUser {
  readonly id: string;
  readonly clerkUserId: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

export async function findUserByClerkId(clerkUserId: string): Promise<AppUser | null> {
  const [row] = await getDb().select().from(users).where(eq(users.clerkUserId, clerkUserId));
  return row ?? null;
}

/**
 * Provisionnement à la volée : Clerk reste la source de vérité, la ligne applicative n'est
 * créée qu'à la première requête authentifiée du compte.
 */
export async function syncUser(input: {
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): Promise<AppUser> {
  const [row] = await getDb()
    .insert(users)
    .values({ ...input, ...auditInsert(input.clerkUserId) })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        ...auditUpdate(input.clerkUserId),
      },
    })
    .returning();

  if (!row) throw new Error("Failed to provision user");
  return row;
}
