import { locales } from "@/i18n/routing";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://seatigo.example.com";

export function buildAlternates(path: string = "") {
  const cleanPath = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${siteUrl}/${locale}${cleanPath}`;
  }
  languages["x-default"] = `${siteUrl}/en${cleanPath}`;
  return { languages };
}

export function canonicalFor(locale: string, path: string = "") {
  const cleanPath = path === "/" ? "" : path;
  return `${siteUrl}/${locale}${cleanPath}`;
}
