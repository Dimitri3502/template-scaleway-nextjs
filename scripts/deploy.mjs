#!/usr/bin/env node
// Construit l'image, la pousse sur le registre Scaleway, puis met le stack à jour.
// Pulumi ne construit jamais d'image : le build reste ici, où le cache Docker est utile.

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INFRA = resolve(ROOT, "infra");
const STACK = process.env.PULUMI_STACK ?? "prod";

/**
 * Les identifiants Scaleway viennent d'un profil `scw`, désigné par le stack lui-même via
 * `scaleway:profile`. Les SCW_* de la session sont retirées de l'environnement des
 * sous-processus : une variable exportée pour un autre projet détournerait sinon le
 * déploiement vers une autre organisation, silencieusement.
 */
const AMBIENT_SCW_VARS = [
  "SCW_PROFILE",
  "SCW_ACCESS_KEY",
  "SCW_SECRET_KEY",
  "SCW_DEFAULT_PROJECT_ID",
  "SCW_DEFAULT_ORGANIZATION_ID",
];

/**
 * Le builder par défaut construit dans le magasin d'images local, et le `docker push` qui suit
 * se fait refuser par le registre Scaleway (`insufficient_scope`). Un builder `docker-container`
 * pousse depuis BuildKit, en réutilisant l'authentification du `docker login` — c'est aussi le
 * seul driver qui construit du `linux/amd64` de façon fiable depuis un Mac ARM.
 */
const BUILDER = "deploy-scaleway";

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: "inherit", ...options });
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options }).trim();
}

/** Créé au premier déploiement, réutilisé — et son cache avec — les fois suivantes. */
function ensureBuilder() {
  try {
    capture("docker", ["buildx", "inspect", BUILDER], { stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    run("docker", ["buildx", "create", "--name", BUILDER, "--driver", "docker-container"]);
  }
}

/** `undefined` si la clé n'est pas définie sur le stack : `pulumi config get` sort en 1. */
function stackConfig(key) {
  try {
    return capture("pulumi", ["config", "get", key, "--stack", STACK], {
      cwd: INFRA,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
}

const profile = stackConfig("scaleway:profile");
if (!profile) {
  console.error(
    `Le stack « ${STACK} » ne désigne aucun profil Scaleway.\n` +
      "  cd infra && pulumi config set scaleway:profile <nom>\n" +
      "Profils disponibles : scw config profile list",
  );
  process.exit(1);
}

/**
 * Les migrations partent de ce poste, par l'endpoint public de PostgreSQL, ouvert au seul
 * `adminCidr` : sans ce bloc la connexion n'aboutirait jamais, et on ne l'apprendrait qu'après
 * le build de l'image.
 */
const MIGRATE = process.env.SKIP_MIGRATIONS !== "1";
if (MIGRATE && !stackConfig("adminCidr")) {
  console.error(
    `Le stack « ${STACK} » n'ouvre l'endpoint PostgreSQL à aucune adresse : les migrations ne\n` +
      "peuvent pas être appliquées depuis ce poste.\n" +
      `  cd infra && pulumi config set adminCidr "$(curl -s https://ifconfig.me)/32"\n` +
      "Ou SKIP_MIGRATIONS=1 pnpm deploy pour ne déployer que l'image.",
  );
  process.exit(1);
}

const env = { ...process.env };
for (const name of AMBIENT_SCW_VARS) delete env[name];
env.SCW_PROFILE = profile;

let secretKey;
try {
  secretKey = capture("scw", ["-p", profile, "config", "get", "secret-key"]);
} catch {
  console.error(`Profil scw « ${profile} » illisible. La CLI scw est-elle installée ?`);
  process.exit(1);
}

function stackOutput(name, { secret = false } = {}) {
  const args = ["stack", "output", name, "--stack", STACK];
  if (secret) args.push("--show-secrets");
  return capture("pulumi", args, { cwd: INFRA, env });
}

const registryEndpoint = stackOutput("registryEndpoint");
const publishableKey = stackOutput("clerkPublishableKey");
const tag = process.env.IMAGE_TAG ?? capture("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT });
const image = `${registryEndpoint}/web:${tag}`;

console.log(`\n→ Profil Scaleway : ${profile}`);
console.log(`→ Image : ${image}\n`);

const registryHost = registryEndpoint.split("/")[0];
run("docker", ["login", registryHost, "-u", "nologin", "--password-stdin"], {
  input: secretKey,
  stdio: ["pipe", "inherit", "inherit"],
});

ensureBuilder();

// Le builder ne charge rien dans le magasin local : l'image part au registre depuis BuildKit.
run(
  "docker",
  [
    "buildx", "build",
    "--builder", BUILDER,
    "--platform", "linux/amd64",
    // NEXT_PUBLIC_* : inlinées au build, elles n'ont aucun effet en variable de conteneur.
    "--build-arg", `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`,
    "--build-arg", `NEXT_PUBLIC_APP_VERSION=${tag}`,
    "-t", image,
    "--push",
    ".",
  ],
  { cwd: ROOT },
);

/**
 * Le schéma migre avant que la nouvelle image ne serve : l'inverse ferait tourner du code neuf
 * sur un schéma ancien pendant tout le déploiement. En contrepartie, une migration doit rester
 * compatible avec le code déjà en ligne — c'est la règle habituelle du déploiement en deux temps.
 */
if (MIGRATE) {
  console.log("\n→ Migrations\n");
  run("pnpm", ["db:migrate"], {
    cwd: ROOT,
    env: { ...env, DATABASE_URL: stackOutput("databaseUrl", { secret: true }) },
  });
} else {
  console.warn("\n⚠ SKIP_MIGRATIONS=1 : le schéma n'est pas migré.\n");
}

run("pulumi", ["config", "set", "imageTag", tag, "--stack", STACK], { cwd: INFRA, env });
run("pulumi", ["up", "--stack", STACK, "--yes"], { cwd: INFRA, env });

console.log(`\n✓ Déployé : ${stackOutput("appUrl")}\n`);
