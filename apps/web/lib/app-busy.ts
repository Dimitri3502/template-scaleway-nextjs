/**
 * Registre des travaux qu'un rechargement interromprait : enregistrement audio, envoi de
 * fichier, brouillon non envoyé. Le service worker consulte ce registre avant de rafraîchir.
 */
export type BusyReason = "recording" | "uploading" | "draft";

const busy = new Set<BusyReason>();
const subscribers = new Set<() => void>();

function notify(): void {
  for (const subscriber of subscribers) subscriber();
}

export function setBusy(reason: BusyReason, isBusy: boolean): void {
  const changed = isBusy ? !busy.has(reason) : busy.has(reason);
  if (!changed) return;

  if (isBusy) busy.add(reason);
  else busy.delete(reason);
  notify();
}

export function isAppBusy(): boolean {
  return busy.size > 0;
}

export function subscribeToBusy(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
