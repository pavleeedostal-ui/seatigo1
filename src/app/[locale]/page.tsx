import { setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { getPopularClubs } from "@/lib/analytics/club-popularity";
import { Hero } from "@/components/home/Hero";
import { PopularMatches } from "@/components/home/PopularMatches";
import { UpcomingFixtures } from "@/components/home/UpcomingFixtures";
import { CompetitionsGrid } from "@/components/home/CompetitionsGrid";
import { PopularClubs } from "@/components/home/PopularClubs";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrustBadges } from "@/components/home/TrustBadges";
import { Faq } from "@/components/home/Faq";

/**
 * Popular Clubs is ranked from live traffic, so the page cannot be baked
 * once at build time — but it must not be scored per request either. ISR
 * gives both: the HTML is served from cache and rebuilt in the background
 * at most this often, and the ranking itself is cached under that again
 * (RANKING_CACHE_TTL_MS).
 */
export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const provider = getFootballDataProvider();
  // Both fixture lists come from the football provider alone. Ticket offers
  // are joined in afterwards for display and never decide what is listed.
  const [popularMatches, { matches: upcomingFixtures }, competitions, popularClubs] =
    await Promise.all([
      provider.getUpcomingMatches(8),
      provider.getMatches({ pageSize: 6 }),
      provider.getCompetitions(),
      // Ranked by measured interest, with a seeded order until there is
      // enough of it — see lib/analytics/club-popularity.ts.
      getPopularClubs(8),
    ]);

  const offersSummaries = await getCheapestOffersForFixtures([
    ...popularMatches,
    ...upcomingFixtures,
  ]);

  return (
    <>
      <Hero />
      <PopularMatches matches={popularMatches} offersSummaries={offersSummaries} />
      <UpcomingFixtures
        matches={upcomingFixtures}
        offersSummaries={offersSummaries}
      />
      <CompetitionsGrid competitions={competitions} />
      <PopularClubs
        clubs={popularClubs.clubs.map((entry) => entry.club)}
        source={popularClubs.source}
      />
      <HowItWorks />
      <TrustBadges />
      <Faq />
    </>
  );
}
