import * as pulumi from "@pulumi/pulumi";
import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config.ts";
import { privateDatabaseUrl } from "./database.ts";
import { privateNetwork } from "./network.ts";
import { registryNamespace } from "./registry.ts";
import { bucket, storageAccessKeyId, storageEndpoint, storageSecretAccessKey } from "./storage.ts";

/** `memoryLimitBytes` attend des octets ; la configuration, elle, reste exprimée en Mo. */
const MEGABYTE = 1024 * 1024;

export const namespace = new scaleway.containers.Namespace("app-namespace", {
  name: resourceName("app"),
  region: settings.region,
  description: "Application web",
});

/**
 * Le conteneur n'est créé qu'une fois `imageTag` défini : au premier `pulumi up` il n'y a
 * pas encore d'image dans le registre. Voir docs/DEPLOY.md, section « amorçage ».
 */
export const container = settings.imageTag
  ? new scaleway.containers.Container("app", {
      name: resourceName("web"),
      namespaceId: namespace.id,
      image: pulumi.interpolate`${registryNamespace.endpoint}/web:${settings.imageTag}`,
      port: 8080,
      protocol: "http1",
      privacy: "public",
      // Redirige HTTP vers HTTPS. Remplace `httpOption: "redirected"`, déprécié.
      httpsConnectionsOnly: true,
      cpuLimit: settings.cpuLimit,
      memoryLimitBytes: settings.memoryLimit * MEGABYTE,
      minScale: settings.minScale,
      maxScale: settings.maxScale,
      timeout: 60,
      // Joint PostgreSQL sans passer par Internet.
      privateNetworkId: privateNetwork.id,
      environmentVariables: {
        NODE_ENV: "production",
        S3_ENDPOINT: storageEndpoint,
        S3_PUBLIC_ENDPOINT: storageEndpoint,
        S3_REGION: settings.region,
        S3_BUCKET: bucket.name,
        // Scaleway Object Storage utilise des URL virtual-hosted, pas de path-style.
        S3_FORCE_PATH_STYLE: "false",
      },
      // Injectées chiffrées et jamais réaffichées par la console.
      // Note : les NEXT_PUBLIC_* n'apparaissent pas ici — elles sont inlinées au build
      // de l'image (build args du Dockerfile), les mettre ici n'aurait aucun effet.
      secretEnvironmentVariables: {
        DATABASE_URL: privateDatabaseUrl,
        CLERK_SECRET_KEY: settings.clerkSecretKey,
        S3_ACCESS_KEY_ID: storageAccessKeyId,
        S3_SECRET_ACCESS_KEY: storageSecretAccessKey,
      },
    })
  : undefined;
