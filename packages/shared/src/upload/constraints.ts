const MB = 1024 * 1024;

export const MAX_IMAGE_BYTES = 15 * MB;
export const MAX_VIDEO_BYTES = 100 * MB;
export const MAX_AUDIO_BYTES = 25 * MB;
export const MAX_FILE_BYTES = 25 * MB;

/** Famille de rendu, indépendante du modèle de données de l'application. */
export const UPLOAD_KINDS = ["image", "video", "audio", "file"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export interface UploadConstraint {
  readonly kind: UploadKind;
  /** Extension déduite du type MIME validé, jamais du nom de fichier annoncé. */
  readonly extension: string;
  readonly maxBytes: number;
}

/**
 * Allowlist : un type MIME absent de cette table est refusé. C'est volontairement une
 * allowlist et non une denylist — un format inconnu doit échouer, pas passer.
 */
export const ACCEPTED_MIME_TYPES = {
  "image/jpeg": { kind: "image", extension: "jpg", maxBytes: MAX_IMAGE_BYTES },
  "image/png": { kind: "image", extension: "png", maxBytes: MAX_IMAGE_BYTES },
  "image/webp": { kind: "image", extension: "webp", maxBytes: MAX_IMAGE_BYTES },
  "image/heic": { kind: "image", extension: "heic", maxBytes: MAX_IMAGE_BYTES },
  "image/heif": { kind: "image", extension: "heif", maxBytes: MAX_IMAGE_BYTES },
  "video/mp4": { kind: "video", extension: "mp4", maxBytes: MAX_VIDEO_BYTES },
  "video/quicktime": { kind: "video", extension: "mov", maxBytes: MAX_VIDEO_BYTES },
  "video/webm": { kind: "video", extension: "webm", maxBytes: MAX_VIDEO_BYTES },
  "audio/mpeg": { kind: "audio", extension: "mp3", maxBytes: MAX_AUDIO_BYTES },
  "audio/mp4": { kind: "audio", extension: "m4a", maxBytes: MAX_AUDIO_BYTES },
  "audio/wav": { kind: "audio", extension: "wav", maxBytes: MAX_AUDIO_BYTES },
  "audio/webm": { kind: "audio", extension: "webm", maxBytes: MAX_AUDIO_BYTES },
  "application/pdf": { kind: "file", extension: "pdf", maxBytes: MAX_FILE_BYTES },
} as const satisfies Record<string, UploadConstraint>;

export type AcceptedMimeType = keyof typeof ACCEPTED_MIME_TYPES;

/** Attribut `accept` des `<input type="file">` : dérivé de l'allowlist, jamais réécrit à la main. */
export const ACCEPTED_MIME_TYPES_ATTRIBUTE = Object.keys(ACCEPTED_MIME_TYPES).join(",");

export const UPLOAD_URL_TTL_SECONDS = 300;
export const DOWNLOAD_URL_TTL_SECONDS = 300;

export function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return Object.hasOwn(ACCEPTED_MIME_TYPES, mimeType);
}

export function uploadConstraintFor(mimeType: AcceptedMimeType): UploadConstraint {
  return ACCEPTED_MIME_TYPES[mimeType];
}
