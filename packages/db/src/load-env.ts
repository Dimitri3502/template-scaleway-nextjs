import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

/**
 * Source unique de configuration locale : `apps/web/.env`, lu par Next.js comme par les
 * scripts `db:*`. Les scripts ne sont pas exécutés par Next, ils chargent donc le fichier eux-mêmes.
 */
export function loadLocalEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(here, "../../../apps/web/.env");
  if (existsSync(envPath)) {
    config({ path: envPath, quiet: true });
  }
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — copy apps/web/.env.example to apps/web/.env");
  }
  return url;
}
