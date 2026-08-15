import { closeDb, getDb } from "./client";
import { loadLocalEnv } from "./load-env";
import { notes } from "./schema/notes";
import { users } from "./schema/users";

loadLocalEnv();

/**
 * Jeu de démonstration minimal. L'utilisateur créé ici ne correspond à aucun compte Clerk :
 * il sert à vérifier que les migrations sont appliquées et que les requêtes fonctionnent.
 * L'application, elle, provisionne la ligne `users` à la volée depuis Clerk.
 */
const DEMO_CLERK_USER_ID = "user_demo_seed";

const db = getDb();

const [owner] = await db
  .insert(users)
  .values({
    clerkUserId: DEMO_CLERK_USER_ID,
    email: "demo@example.com",
    firstName: "Utilisateur",
    lastName: "Démo",
    createdBy: DEMO_CLERK_USER_ID,
    updatedBy: DEMO_CLERK_USER_ID,
  })
  .onConflictDoNothing({ target: users.clerkUserId })
  .returning();

if (owner) {
  await db.insert(notes).values([
    {
      ownerId: owner.id,
      title: "Première note",
      body: "Cette note vient du seed. Supprimez-la quand la verticale de démonstration part.",
      createdBy: DEMO_CLERK_USER_ID,
      updatedBy: DEMO_CLERK_USER_ID,
    },
    {
      ownerId: owner.id,
      title: "Deuxième note",
      body: "",
      createdBy: DEMO_CLERK_USER_ID,
      updatedBy: DEMO_CLERK_USER_ID,
    },
  ]);
  console.warn("Seed applied.");
} else {
  console.warn("Seed skipped: demo user already exists.");
}

await closeDb();
