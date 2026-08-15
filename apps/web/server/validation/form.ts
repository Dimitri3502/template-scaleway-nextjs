import { FieldValidationError } from "@acme/shared";

import type { MessageKey } from "../../i18n";

function fail(field: string, messageKey: MessageKey): never {
  throw new FieldValidationError(field, messageKey);
}

function read(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalString(formData: FormData, field: string, maxLength: number): string {
  const value = read(formData, field);
  if (value.length > maxLength) fail(field, "error.tooLong");
  return value;
}

export function requiredString(formData: FormData, field: string, maxLength: number): string {
  const value = read(formData, field);
  if (value.length === 0) fail(field, "error.required");
  if (value.length > maxLength) fail(field, "error.tooLong");
  return value;
}
