import "server-only";

import { UnauthenticatedError } from "@acme/shared";
import { auth, currentUser } from "@clerk/nextjs/server";

import type { AppUser } from "../services/users";
import { findUserByClerkId, syncUser } from "../services/users";
import { recordAuditEvent } from "./audit";

/**
 * Contexte d'accès de la requête : le compte Clerk authentifié, synchronisé avec la base.
 * L'appel à Clerk pour les informations de profil n'a lieu qu'à la première connexion.
 *
 * Tout service métier reçoit `user.id` et l'utilise comme prédicat d'appartenance.
 */
export async function requireUser(): Promise<AppUser> {
  const { userId } = await auth();
  if (!userId) throw new UnauthenticatedError();

  const known = await findUserByClerkId(userId);
  if (known) return known;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new UnauthenticatedError();

  const user = await syncUser({
    clerkUserId: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? `${userId}@clerk.local`,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  });

  recordAuditEvent("user.signed_in", { userId: user.id });
  return user;
}
