import * as pulumi from "@pulumi/pulumi";
import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config.ts";

/**
 * Bucket privé et versionné. Aucune politique anonyme : tout accès passe par une URL
 * signée à durée courte, générée par `packages/storage`.
 */
export const bucket = new scaleway.object.Bucket("attachments", {
  name: resourceName("attachments"),
  region: settings.region,
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
 * La privauté se déclare par une ressource dédiée : l'attribut `acl` du bucket est déprécié.
 * `projectId` est passé explicitement — l'API S3 est scopée par projet, et une ressource
 * fille créée sur le projet par défaut échouerait en 403 sur un autre projet.
 */
export const bucketAcl = new scaleway.object.BucketAcl("attachments-acl", {
  bucket: bucket.id,
  acl: "private",
  region: settings.region,
  projectId: bucket.projectId,
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
