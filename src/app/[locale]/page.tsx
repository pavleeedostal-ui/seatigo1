import { setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { Hero } from "@/components/home/Hero";
import { PopularMatches } from "@/components/home/PopularMatches";
import { DiscoverMatchesBanner } from "@/components/home/DiscoverMatchesBanner";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrustBadges } from "@/components/home/TrustBadges";
import { Faq } from "@/components/home/Faq";

/**
 * The featured fixtures are live data, so the page cannot be baked once at
 * build time — but it must not be rebuilt per request either. ISR gives
 * both: the HTML is served from cache and rebuilt in the background at most
 * this often.
 */
export const revalidate = 300;

/**
 * Search, a handful of real fixtures, one invitation, then the reassurance
 * content. The competition and club grids that used to sit in the middle
 * were a directory restating navigation that already exists in the header
 * and on their own pages; the editorial banner asks a question instead.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const provider = getFootballDataProvider();
  // Fixtures come from the football provider alone. Ticket offers are
  // joined in afterwards for display and never decide what is listed.
  const popularMatches = await provider.getUpcomingMatches(6);
  const offersSummaries = await getCheapestOffersForFixtures(popularMatches);

  return (
    <>
      <Hero />
      {/* The hero's search surface hangs past its bottom edge and overlaps
          this section. The extra top padding is that overlap plus the
          section's usual breathing room, so the heading never collides with
          the floating search bar — keep it in step with the negative bottom
          margin in Hero.tsx. */}
      <PopularMatches
        matches={popularMatches}
        offersSummaries={offersSummaries}
        className="pt-24 sm:pt-32 lg:pt-36"
      />
      <DiscoverMatchesBanner />
      {/* The informational block. "How it works" used to sit high enough to
          read as a pitch; down here it is reference material, next to the
          other things someone checks before they trust a comparison site. */}
      <TrustBadges />
      <HowItWorks />
      <Faq />
    </>
  );
}
