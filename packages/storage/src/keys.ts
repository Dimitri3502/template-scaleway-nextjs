import { ForbiddenError } from "@acme/shared";

/**
 * Clé préfixée par la ressource propriétaire : l'autorisation se vérifie par simple
 * comparaison de préfixe, sans relire la base. Le client ne choisit ni l'identifiant de
 * pièce jointe ni la clé — les deux sont générés côté serveur puis recalculés et comparés
 * à la confirmation de l'envoi.
 *
 * `scope` est le nom de la collection propriétaire ("notes", "invoices", "tickets"…).
 */
export function buildObjectKey(input: {
  scope: string;
  resourceId: string;
  attachmentId: string;
  slug: string;
  extension: string;
}): string {
  return `${input.scope}/${input.resourceId}/${input.attachmentId}/${input.slug}.${input.extension}`;
}

export function resourcePrefix(scope: string, resourceId: string): string {
  return `${scope}/${resourceId}/`;
}

export function assertKeyBelongsTo(objectKey: string, scope: string, resourceId: string): void {
  if (!objectKey.startsWith(resourcePrefix(scope, resourceId))) {
    throw new ForbiddenError("Object key does not belong to this resource");
  }
}
