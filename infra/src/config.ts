import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

/**
 * Configuration du stack. Les secrets sont chiffrés par Pulumi dans `Pulumi.prod.yaml` :
 * aucune valeur en clair n'entre dans le dépôt.
 *
 * Les identifiants Scaleway eux-mêmes ne passent pas par ici : la clé `scaleway:profile`
 * désigne un profil de `~/.config/scw/config.yaml`, que le provider lit directement. Le stack
 * porte ainsi son organisation, indépendamment du profil actif dans la session.
 */
export const settings = {
  /** `fr-par`, `nl-ams` ou `pl-waw`. */
  region: config.get("region") ?? "fr-par",

  /** Type de nœud PostgreSQL. `DB-DEV-S` est le moins cher, suffisant pour démarrer. */
  dbNodeType: config.get("dbNodeType") ?? "DB-DEV-S",
  dbVolumeSizeInGb: config.getNumber("dbVolumeSizeInGb") ?? 10,

  /**
   * Bloc autorisé à joindre l'endpoint public de PostgreSQL (migrations et `db:studio`
   * depuis votre poste). Le conteneur, lui, passe par le réseau privé.
   * Laissez vide pour n'ouvrir aucun accès public.
   */
  adminCidr: config.get("adminCidr") ?? "",

  /** `minScale: 1` évite le démarrage à froid ; passez à 0 pour ne payer qu'à l'usage. */
  minScale: config.getNumber("minScale") ?? 1,
  maxScale: config.getNumber("maxScale") ?? 3,
  cpuLimit: config.getNumber("cpuLimit") ?? 1000,
  /** En Mo. `src/app.ts` le convertit en octets pour `memoryLimitBytes`. */
  memoryLimit: config.getNumber("memoryLimit") ?? 2048,

  /**
   * Tag de l'image applicative. Absent au premier `pulumi up` : l'infrastructure est créée
   * sans conteneur, puis `pnpm deploy` construit l'image, la pousse et repasse ici.
   */
  imageTag: config.get("imageTag"),

  clerkSecretKey: config.requireSecret("clerkSecretKey"),
  /** Publiable, donc non secrète — mais inlinée au build : elle sert au `docker build`. */
  clerkPublishableKey: config.require("clerkPublishableKey"),
} as const;

const stackName = pulumi.getStack();
const projectName = pulumi.getProject();

/** Préfixe de nommage des ressources : `acme-prod-…`. */
export function resourceName(suffix: string): string {
  return `${projectName}-${stackName}-${suffix}`;
}
