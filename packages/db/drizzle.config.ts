import { defineConfig } from "drizzle-kit";

import { loadLocalEnv, requireDatabaseUrl } from "./src/load-env";

loadLocalEnv();

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: requireDatabaseUrl() },
  strict: true,
  verbose: true,
});
