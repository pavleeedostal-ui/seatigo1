import { setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { Hero } from "@/components/home/Hero";
import { PopularMatches } from "@/components/home/PopularMatches";
import { DiscoverMatchesBanner } from "@/components/home/DiscoverMatchesBanner";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Faq } from "@/components/home/Faq";

/**
 * The featured fixtures are live data, so the page cannot be baked once at
 * build time — but it must not be rebuilt per request either. ISR gives
 * both: the HTML is served from cache and rebuilt in the background at most
 * this often.
 */
export const revalidate = 300;

/** Three stickers on the hero's sheet, then the next eight on the album page. */
const HERO_STICKERS = 3;
const FEATURED = 8;

/**
 * The album, opened: the cover page with the search and the next fixtures
 * as stickers, the following fixtures as a page of slots, one photograph of
 * a real matchday, then how it works and the questions people ask before
 * trusting a comparison site.
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
  const upcoming = await provider.getUpcomingMatches(HERO_STICKERS + FEATURED);
  const offersSummaries = await getCheapestOffersForFixtures(upcoming);

  const stickers = upcoming.slice(0, HERO_STICKERS).map((match) => ({
    match,
    summary: offersSummaries.get(match.id) ?? null,
  }));

  return (
    <>
      <Hero stickers={stickers} />
      <PopularMatches
        matches={upcoming.slice(HERO_STICKERS)}
        offersSummaries={offersSummaries}
      />
      <DiscoverMatchesBanner
        image={{
          src: "/images/editorial/matchday-floodlights.jpg",
          alt: "",
          author: "Krzysztof Popławski",
          license: "CC BY 4.0",
          sourceUrl:
            "https://commons.wikimedia.org/wiki/File:Mecz_pi%C5%82karski_Wis%C5%82a_Krak%C3%B3w_-_Zag%C5%82%C4%99bie_Sosnwoiec,_28_pa%C5%BAdziernika_2022,_Po%C5%BCegnanie_Stadionu_Ludowego,_KP.jpg",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        }}
      />
      <HowItWorks />
      <Faq />
    </>
  );
}
