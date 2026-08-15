import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { requireDatabaseUrl } from "./load-env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

interface DatabaseGlobal {
  appPool?: pg.Pool | undefined;
  appDb?: Database | undefined;
}

const globalForDb = globalThis as typeof globalThis & DatabaseGlobal;

/**
 * Initialisation paresseuse : `next build` importe les services sans base disponible,
 * la connexion ne doit donc être exigée qu'à la première requête réelle.
 */
export function getDb(): Database {
  if (globalForDb.appDb) return globalForDb.appDb;

  const pool = new pg.Pool({ connectionString: requireDatabaseUrl(), max: 10 });
  const db = drizzle(pool, { schema });

  globalForDb.appPool = pool;
  globalForDb.appDb = db;
  return db;
}

export async function closeDb(): Promise<void> {
  await globalForDb.appPool?.end();
  globalForDb.appPool = undefined;
  globalForDb.appDb = undefined;
}
