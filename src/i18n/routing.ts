import { defineRouting } from "next-intl/routing";

export const locales = ["en", "cs", "de", "es", "it", "fr"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  cs: "Čeština",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  fr: "Français",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
