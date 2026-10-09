import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";
import { getFootballDataProvider } from "@/lib/football";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const provider = getFootballDataProvider();
  const [{ matches }, competitions, clubs] = await Promise.all([
    provider.getMatches({ pageSize: 1000 }),
    provider.getCompetitions(),
    provider.getClubs(),
  ]);

  const staticPaths = ["", "/matches", "/competitions", "/clubs"];
  // Every discoverable fixture is indexable, with or without ticket offers.
  const matchPaths = matches.map((m) => `/matches/${m.slug}`);
  const competitionPaths = competitions.map((c) => `/competitions/${c.slug}`);
  const clubPaths = clubs.map((c) => `/clubs/${c.slug}`);

  const entries: MetadataRoute.Sitemap = [];

  for (const path of [
    ...staticPaths,
    ...competitionPaths,
    ...clubPaths,
    ...matchPaths,
  ]) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path.startsWith("/matches/") ? "hourly" : "daily",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  return entries;
}
