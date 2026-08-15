/** Nom affichable, tolérant aux champs absents renvoyés par le fournisseur d'identité. */
export function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}
