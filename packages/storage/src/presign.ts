import { DOWNLOAD_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS } from "@acme/shared";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { internalClient, publicClient, storageBucket } from "./client";

/**
 * `ContentLength` est signé : la taille annoncée au serveur ne peut pas être trichée
 * au moment de l'envoi.
 */
export async function createUploadUrl(input: {
  objectKey: string;
  mimeType: string;
  size: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: storageBucket(),
    Key: input.objectKey,
    ContentType: input.mimeType,
    ContentLength: input.size,
  });

  return getSignedUrl(publicClient(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(["content-length", "content-type"]),
  });
}

export async function createDownloadUrl(input: {
  objectKey: string;
  mimeType: string;
  originalFilename: string;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: storageBucket(),
    Key: input.objectKey,
    ResponseContentType: input.mimeType,
    ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(
      input.originalFilename,
    )}`,
  });

  return getSignedUrl(publicClient(), command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

export async function deleteStoredObject(objectKey: string): Promise<void> {
  await internalClient().send(
    new DeleteObjectCommand({ Bucket: storageBucket(), Key: objectKey }),
  );
}
