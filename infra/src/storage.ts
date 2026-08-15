import * as pulumi from "@pulumi/pulumi";
import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config";

/**
 * Bucket privé et versionné. Aucune politique anonyme : tout accès passe par une URL
 * signée à durée courte, générée par `packages/storage`.
 */
export const bucket = new scaleway.object.Bucket("attachments", {
  name: resourceName("attachments"),
  region: settings.region,
  acl: "private",
  versioning: { enabled: true },
  corsRules: [
    {
      // L'envoi direct navigateur → bucket est une requête cross-origin.
      allowedMethods: ["GET", "PUT", "HEAD"],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAgeSeconds: 3000,
    },
  ],
});

/**
 * Identité applicative dédiée au stockage : la clé injectée dans le conteneur ne peut
 * rien faire d'autre que lire et écrire des objets. Rien à copier depuis la console.
 */
const application = new scaleway.iam.Application("storage-application", {
  name: resourceName("storage"),
  description: "Accès Object Storage de l'application",
});

export const storagePolicy = new scaleway.iam.Policy("storage-policy", {
  name: resourceName("storage"),
  description: "Lecture et écriture sur le bucket applicatif",
  applicationId: application.id,
  rules: [
    {
      projectIds: [bucket.projectId],
      permissionSetNames: ["ObjectStorageObjectsRead", "ObjectStorageObjectsWrite"],
    },
  ],
});

const apiKey = new scaleway.iam.ApiKey("storage-api-key", {
  applicationId: application.id,
  description: "Clé S3 de l'application",
});

export const storageAccessKeyId = apiKey.accessKey;
export const storageSecretAccessKey = pulumi.secret(apiKey.secretKey);
export const storageEndpoint = pulumi.interpolate`https://s3.${settings.region}.scw.cloud`;
