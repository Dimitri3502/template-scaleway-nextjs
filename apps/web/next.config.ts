import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Serveur autonome pour l'image Docker : `.next/standalone/…/server.js` n'a besoin
  // d'aucun `pnpm install` à l'exécution.
  output: "standalone",
  // Obligatoire en monorepo : sans cela le traçage s'arrête à `apps/web` et les paquets
  // du workspace manquent dans l'image.
  outputFileTracingRoot: join(here, "../../"),
  // Le traceur n'embarque que la variante `cjs/` de @swc/helpers alors que le require-hook
  // de Next en résout la variante `esm/` : sans cette inclusion, le serveur standalone
  // refuse de démarrer (MODULE_NOT_FOUND sur esm/_interop_require_default.js).
  outputFileTracingIncludes: {
    "**/*": ["../../node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*"],
  },
  // Les paquets internes sont livrés en TypeScript source : Next les compile lui-même.
  transpilePackages: ["@acme/ui", "@acme/shared", "@acme/db", "@acme/storage"],
  experimental: {
    // `forbidden()` renvoie un vrai 403 depuis une page.
    authInterrupts: true,
  },
};

export default nextConfig;
