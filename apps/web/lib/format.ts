import type { MessageKey } from "../i18n";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export interface RelativeTime {
  readonly key: MessageKey;
  readonly values?: { readonly count: number };
}

/** Renvoie une clé i18n et ses valeurs : la traduction reste à la charge du composant. */
export function relativeTime(from: Date, now: Date): RelativeTime {
  const elapsed = Math.max(0, now.getTime() - from.getTime());

  if (elapsed < MINUTE_MS) return { key: "time.now" };
  if (elapsed < HOUR_MS) {
    return { key: "time.minutes", values: { count: Math.floor(elapsed / MINUTE_MS) } };
  }
  if (elapsed < DAY_MS) {
    return { key: "time.hours", values: { count: Math.floor(elapsed / HOUR_MS) } };
  }
  if (elapsed < 2 * DAY_MS) return { key: "time.yesterday" };
  return { key: "time.days", values: { count: Math.floor(elapsed / DAY_MS) } };
}

const clockFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function formatClockTime(date: Date): string {
  return clockFormatter.format(date);
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export function formatDay(date: Date): string {
  return dayFormatter.format(date);
}
