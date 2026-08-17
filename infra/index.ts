import * as pulumi from "@pulumi/pulumi";

import { container, namespace } from "./src/app";
import { settings } from "./src/config";
import { adminDatabaseUrl, instance } from "./src/database";
import { registryNamespace } from "./src/registry";
import { bucket } from "./src/storage";

/** `index.ts` ne fait que câbler et exporter : toute la logique vit dans `src/`. */

/** `publicEndpoint` porte déjà le schéma (`https://…`), contrairement à l'ancien `domainName`. */
export const appUrl = container
  ? container.publicEndpoint
  : "non déployée — lancez `pnpm deploy` pour construire et publier l'image";

export const registryEndpoint = registryNamespace.endpoint;
export const containerNamespaceId = namespace.id;
export const bucketName = bucket.name;
export const databaseName = instance.name;

/** URL d'administration, à utiliser pour `pnpm db:migrate` depuis votre poste. */
export const databaseUrl = pulumi.secret(adminDatabaseUrl);

/** Rappelé ici pour que `pnpm deploy` puisse le passer en build arg sans le redemander. */
export const clerkPublishableKey = settings.clerkPublishableKey;
