import * as pulumi from "@pulumi/pulumi";

import { container, namespace } from "./src/app.ts";
import { settings } from "./src/config.ts";
import { adminDatabaseUrl, instance } from "./src/database.ts";
import { clerkDnsRecords, webDomain } from "./src/dns.ts";
import { registryNamespace } from "./src/registry.ts";
import { bucket } from "./src/storage.ts";

/** `index.ts` ne fait que câbler et exporter : toute la logique vit dans `src/`. */

/**
 * URL canonique : le domaine custom dès qu'il est câblé, sinon l'endpoint du conteneur —
 * qui porte déjà le schéma (`https://…`), contrairement à l'ancien `domainName`.
 * `pnpm deploy` affiche cette sortie en fin de déploiement.
 */
export const appUrl = webDomain
  ? pulumi.interpolate`https://${webDomain.hostname}`
  : container
    ? container.publicEndpoint
    : "non déployée — lancez `pnpm deploy` pour construire et publier l'image";

/** Reste joignable même sous domaine custom : utile tant que le certificat n'est pas émis. */
export const containerUrl = container?.publicEndpoint;

/** Vide tant qu'aucune zone Cloudflare n'est configurée. */
export const clerkDnsHosts = clerkDnsRecords.map((record) => record.name);

export const registryEndpoint = registryNamespace.endpoint;
export const containerNamespaceId = namespace.id;
export const bucketName = bucket.name;
export const databaseName = instance.name;

/** URL d'administration, à utiliser pour `pnpm db:migrate` depuis votre poste. */
export const databaseUrl = pulumi.secret(adminDatabaseUrl);

/** Rappelé ici pour que `pnpm deploy` puisse le passer en build arg sans le redemander. */
export const clerkPublishableKey = settings.clerkPublishableKey;
