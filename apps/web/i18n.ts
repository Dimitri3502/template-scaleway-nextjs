import { fr } from "./messages/fr";

export const LOCALES = ["fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

const dictionaries = { fr } as const;

/** Une clé inconnue ne compile pas. */
export type MessageKey = keyof typeof fr;

export type TranslationValues = Readonly<Record<string, string | number>>;
export type Translate = (key: MessageKey, values?: TranslationValues) => string;

function interpolate(template: string, values: TranslationValues | undefined): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

/** `t` ne transite jamais en props : chaque composant appelle `getTranslations()` localement. */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Translate {
  const dictionary = dictionaries[locale];
  return (key, values) => interpolate(dictionary[key], values);
}
