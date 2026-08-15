import { S3Client } from "@aws-sdk/client-s3";

import type { StorageConfig } from "./config";
import { readStorageConfig } from "./config";

interface StorageGlobal {
  appS3Internal?: S3Client | undefined;
  appS3Public?: S3Client | undefined;
  appS3Config?: StorageConfig | undefined;
}

const globalForStorage = globalThis as typeof globalThis & StorageGlobal;

function config(): StorageConfig {
  globalForStorage.appS3Config ??= readStorageConfig();
  return globalForStorage.appS3Config;
}

export function storageBucket(): string {
  return config().bucket;
}

function createClient(endpoint: string): S3Client {
  const { region, accessKeyId, secretAccessKey, forcePathStyle } = config();
  return new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Opérations serveur (suppression, métadonnées) : passe par l'endpoint interne. */
export function internalClient(): S3Client {
  globalForStorage.appS3Internal ??= createClient(config().endpoint);
  return globalForStorage.appS3Internal;
}

/** Signature des URL remises au navigateur : doit porter l'hôte que le navigateur atteint. */
export function publicClient(): S3Client {
  globalForStorage.appS3Public ??= createClient(config().publicEndpoint);
  return globalForStorage.appS3Public;
}
