import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDb, getDb } from "./client";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");

await migrate(getDb(), { migrationsFolder });
await closeDb();

console.warn("Migrations applied.");
