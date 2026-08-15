import type { ActionState } from "@acme/shared";
import { errorState, FieldValidationError } from "@acme/shared";
import { unstable_rethrow } from "next/navigation";

import type { MessageKey } from "../i18n";
import { getTranslations } from "../i18n";
import { messageKeyForError } from "./errors";

/**
 * Enveloppe de toutes les Server Actions : traduit les erreurs en `ActionState`.
 * `unstable_rethrow` passe en premier pour laisser remonter `redirect()` et `notFound()`.
 */
export async function runAction(execute: () => Promise<ActionState>): Promise<ActionState> {
  const t = getTranslations();
  try {
    return await execute();
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof FieldValidationError) {
      // `packages/shared` ignore le dictionnaire : seuls les helpers de `server/validation`
      // construisent cette erreur, et ils n'acceptent qu'une `MessageKey`.
      const message = t(error.messageKey as MessageKey);
      return errorState(message, { [error.field]: message });
    }

    return errorState(t(messageKeyForError(error)));
  }
}
