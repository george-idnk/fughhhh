import ar from "./ar";
import en, { type Dictionary } from "./en";
import he from "./he";

export const LOCALES = ["ar", "en", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  he: "עברית",
};

const dictionaries: Record<Locale, Dictionary> = { ar, en, he };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function defaultLocale(): Locale {
  const env = process.env.DEFAULT_LOCALE;
  return isLocale(env) ? env : "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

/** Replace `{name}` placeholders. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Intl locale tag — Latin digits are used for Arabic, as is common in the Galilee. */
export function intlTag(locale: Locale): string {
  return locale === "ar" ? "ar-u-nu-latn" : locale === "he" ? "he-IL" : "en-GB";
}

export type { Dictionary };
