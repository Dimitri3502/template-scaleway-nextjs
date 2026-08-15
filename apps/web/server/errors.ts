import {
  AttachmentTooLargeError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  UnsupportedMimeTypeError,
  UploadFailedError,
} from "@acme/shared";

import type { MessageKey } from "../i18n";

/**
 * Table de correspondance erreur → clé i18n. Toute autre erreur devient `error.unknown`.
 * L'ordre compte : une sous-classe doit précéder sa classe parente.
 */
const ERROR_MESSAGE_KEYS = [
  [AttachmentTooLargeError, "error.attachmentTooLarge"],
  [UnsupportedMimeTypeError, "error.unsupportedMimeType"],
  [UploadFailedError, "error.uploadFailed"],
  [UnauthenticatedError, "error.unauthenticated"],
  [NotFoundError, "error.notFound"],
  [ForbiddenError, "error.forbidden"],
] as const satisfies readonly (readonly [new (...args: never[]) => Error, MessageKey])[];

export function messageKeyForError(error: unknown): MessageKey {
  for (const [ErrorClass, messageKey] of ERROR_MESSAGE_KEYS) {
    if (error instanceof ErrorClass) return messageKey;
  }
  return "error.unknown";
}
