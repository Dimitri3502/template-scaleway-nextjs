/** Erreur de saisie rattachée à un champ de formulaire. `messageKey` est une clé i18n. */
export class FieldValidationError extends Error {
  constructor(
    readonly field: string,
    readonly messageKey: string,
  ) {
    super(`Invalid value for field "${field}"`);
    this.name = "FieldValidationError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class AttachmentTooLargeError extends Error {
  constructor(
    readonly maxBytes: number,
    message = "Attachment is too large",
  ) {
    super(message);
    this.name = "AttachmentTooLargeError";
  }
}

export class UnsupportedMimeTypeError extends Error {
  constructor(
    readonly mimeType: string,
    message = "Unsupported mime type",
  ) {
    super(message);
    this.name = "UnsupportedMimeTypeError";
  }
}

export class UploadFailedError extends Error {
  constructor(message = "Upload failed") {
    super(message);
    this.name = "UploadFailedError";
  }
}
