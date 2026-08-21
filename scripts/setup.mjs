#!/usr/bin/env node
// Renomme le template puis s'efface. Usage : pnpm run setup <nom-du-projet>
// `run` est obligatoire : `pnpm setup` est une commande native de pnpm, qui masque ce script.

import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLACEHOLDER = "acme";
const IGNORED = new Set(["node_modules", ".git", ".next", ".turbo", "dist", "out", "coverage"]);
const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|lock)$/i;

const name = process.argv[2];

if (!name) {
  console.error("Usage : pnpm run setup <nom-du-projet>");
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]{1,38}[a-z0-9]$/.test(name)) {
  console.error(
    `Nom invalide : "${name}".\n` +
      "Attendu : minuscules, chiffres et tirets, de 3 à 40 caractères, commençant par une lettre.",
  );
  process.exit(1);
}

const capitalized = name
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (IGNORED.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (!BINARY_EXTENSIONS.test(entry)) yield path;
  }
}

const upper = name.toUpperCase().replaceAll("-", "_");

/**
 * Le lockfile ne subit qu'un remplacement ciblé sur le scope npm : un « acme » nu pourrait
 * apparaître dans une empreinte d'intégrité base64, et le réécrire corromprait le fichier.
 */
function rename(content, path) {
  if (path.endsWith("pnpm-lock.yaml")) return content.replaceAll("@acme/", `@${name}/`);
  return content
    .replaceAll("acme", name)
    .replaceAll("Acme", capitalized)
    .replaceAll("ACME", upper);
}

let changed = 0;

for (const path of walk(ROOT)) {
  const before = readFileSync(path, "utf8");
  const after = rename(before, path);

  if (after !== before) {
    writeFileSync(path, after);
    changed += 1;
  }
}

const envExample = join(ROOT, "apps/web/.env.example");
const envFile = join(ROOT, "apps/web/.env");
if (!existsSync(envFile)) copyFileSync(envExample, envFile);

const pulumiExample = join(ROOT, "infra/Pulumi.prod.yaml.example");
const pulumiConfig = join(ROOT, "infra/Pulumi.prod.yaml");
if (!existsSync(pulumiConfig)) copyFileSync(pulumiExample, pulumiConfig);

console.log(
  [
    `Projet renommé en « ${name} » (${changed} fichiers modifiés).`,
    "",
    "apps/web/.env et infra/Pulumi.prod.yaml ont été créés.",
    "",
    "Étapes suivantes :",
    "  1. Renseignez les clés Clerk dans apps/web/.env",
    "  2. pnpm install",
    "  3. pnpm infra:up && pnpm db:migrate && pnpm db:seed",
    "  4. pnpm dev",
    "",
    "Déploiement : docs/DEPLOY.md",
  ].join("\n"),
);

// Le script n'a de sens qu'une fois : il disparaît avec l'entrée qui l'appelle.
rmSync(fileURLToPath(import.meta.url));

const packageJsonPath = join(ROOT, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
delete packageJson.scripts.setup;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
