#!/usr/bin/env node
// Construit l'image, la pousse sur le registre Scaleway, puis met le stack à jour.
// Pulumi ne construit jamais d'image : le build reste ici, où le cache Docker est utile.

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INFRA = resolve(ROOT, "infra");
const STACK = process.env.PULUMI_STACK ?? "prod";

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: "inherit", ...options });
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options }).trim();
}

function stackOutput(name, { secret = false } = {}) {
  const args = ["stack", "output", name, "--stack", STACK];
  if (secret) args.push("--show-secrets");
  return capture("pulumi", args, { cwd: INFRA });
}

const secretKey = process.env.SCW_SECRET_KEY;
if (!secretKey) {
  console.error("SCW_SECRET_KEY doit être défini pour se connecter au registre Scaleway.");
  process.exit(1);
}

const registryEndpoint = stackOutput("registryEndpoint");
const publishableKey = stackOutput("clerkPublishableKey");
const tag = process.env.IMAGE_TAG ?? capture("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT });
const image = `${registryEndpoint}/web:${tag}`;

console.log(`\n→ Image : ${image}\n`);

const registryHost = registryEndpoint.split("/")[0];
run("docker", ["login", registryHost, "-u", "nologin", "--password-stdin"], {
  input: secretKey,
  stdio: ["pipe", "inherit", "inherit"],
});

run(
  "docker",
  [
    "build",
    "--platform", "linux/amd64",
    // NEXT_PUBLIC_* : inlinées au build, elles n'ont aucun effet en variable de conteneur.
    "--build-arg", `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey}`,
    "--build-arg", `NEXT_PUBLIC_APP_VERSION=${tag}`,
    "-t", image,
    ".",
  ],
  { cwd: ROOT },
);

run("docker", ["push", image], { cwd: ROOT });

run("pulumi", ["config", "set", "imageTag", tag, "--stack", STACK], { cwd: INFRA });
run("pulumi", ["up", "--stack", STACK, "--yes"], { cwd: INFRA });

console.log(`\n✓ Déployé : ${stackOutput("appUrl")}\n`);
