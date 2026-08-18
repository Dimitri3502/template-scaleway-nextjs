import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

/**
 * CNAME réclamé par Clerk pour un domaine custom (dashboard Clerk → Domains). `host` et
 * `target` sont des noms complets : le provider Cloudflare v6 n'accepte plus de nom relatif
 * à la zone. `key` nomme la ressource Pulumi — le changer détruit puis recrée le CNAME.
 */
export interface ClerkDnsRecord {
  key: string;
  host: string;
  target: string;
}

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
   * Vide, aucun accès public n'est ouvert — et `pnpm deploy` s'arrête, faute de pouvoir
   * migrer le schéma.
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

  /**
   * Nom d'hôte public de l'application (`app.mondomaine.fr`). Vide, le conteneur n'est
   * joignable que par son endpoint Scaleway et `src/dns.ts` ne crée rien.
   */
  appHostname: config.get("appHostname") ?? "",

  /**
   * Zone Cloudflare hébergeant `appHostname` et les enregistrements Clerk. Absente, aucune
   * ressource Cloudflare n'est créée — le provider n'est alors pas sollicité et son jeton
   * (`cloudflare:apiToken`) n'est pas nécessaire.
   */
  cloudflareZoneId: config.get("cloudflareZoneId") ?? "",

  /**
   * Proxy Cloudflare sur le seul CNAME de l'application. À laisser désactivé : il fait
   * échouer la validation du certificat par Scaleway, qui gère déjà TLS.
   */
  cloudflareProxied: config.getBoolean("cloudflareProxied") ?? false,

  /** TTL des enregistrements non proxifiés. `1` = automatique, sinon de 60 à 86400. */
  dnsTtl: config.getNumber("dnsTtl") ?? 300,

  /** CNAME du domaine custom Clerk, recopiés depuis le dashboard. */
  clerkDnsRecords: config.getObject<ClerkDnsRecord[]>("clerkDnsRecords") ?? [],
} as const;

const stackName = pulumi.getStack();
const projectName = pulumi.getProject();

/** Préfixe de nommage des ressources : `acme-prod-…`. */
export function resourceName(suffix: string): string {
  return `${projectName}-${stackName}-${suffix}`;
}
