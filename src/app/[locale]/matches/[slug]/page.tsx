import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import { getOffersForFixture, getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { recordClubInterest } from "@/lib/analytics/club-popularity";
import { MatchHeroCard } from "@/components/matches/MatchHeroCard";
import { MatchOfferStats } from "@/components/matches/MatchOfferStats";
import { RelatedMatches, type RelatedMatchGroup } from "@/components/matches/RelatedMatches";
import { TicketComparison } from "@/components/offers/TicketComparison";
import { EmptyOffers } from "@/components/offers/EmptyOffers";

interface PageParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const provider = getFootballDataProvider();
  const match = await provider.getMatchBySlug(slug);

  if (!match) {
    return { title: "Seatigo" };
  }

  const t = await getTranslations({ locale, namespace: "MatchDetail" });
  const title = `${match.homeTeam.name} vs ${match.awayTeam.name} ${t("metaTitleSuffix")} | Seatigo`;
  const description = t("metaDescription", {
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    competition: match.competition.name,
    stadium: match.stadium?.name ?? match.competition.name,
    city: match.city ?? match.competition.country,
  });
  const path = `/matches/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
    openGraph: { title, description, type: "website" },
  };
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ tickets?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const provider = getFootballDataProvider();
  const match = await provider.getMatchBySlug(slug);
  const t = await getTranslations("MatchDetail");
  const tOffers = await getTranslations("Offers");

  if (!match) {
    notFound();
  }

  // Interest in a fixture is interest in both clubs playing it.
  recordClubInterest({
    type: "match_view",
    clubIds: [match.homeTeam.id, match.awayTeam.id],
    fixtureId: match.id,
  });

  // Offers are looked up for the fixture, never the other way round: the
  // page renders in full whether or not any seller has listed this match.
  const { offers } = await getOffersForFixture(match);
  const availability = getTicketAvailability(match, offers.length > 0);

  // A fixture with nothing to compare must still lead somewhere, so the page
  // offers real alternatives: the same two clubs, and the same competition.
  // Only looked up when they are going to be shown.
  const related: RelatedMatchGroup[] = [];
  let relatedSummaries = new Map<string, CheapestOfferSummary>();
  if (availability !== "available") {
    const [home, away, competition] = await Promise.all([
      provider.getMatches({ club: match.homeTeam.slug, pageSize: 4 }),
      provider.getMatches({ club: match.awayTeam.slug, pageSize: 4 }),
      provider.getMatches({ competition: match.competition.slug, pageSize: 5 }),
    ]);
    const exclude = new Set([match.id]);
    const take = (list: typeof home.matches, limit: number) => {
      const picked = list.filter((m) => !exclude.has(m.id)).slice(0, limit);
      for (const m of picked) exclude.add(m.id);
      return picked;
    };

    related.push(
      {
        kind: "homeTeam",
        name: match.homeTeam.name,
        href: `/clubs/${match.homeTeam.slug}`,
        matches: take(home.matches, 2),
      },
      {
        kind: "awayTeam",
        name: match.awayTeam.name,
        href: `/clubs/${match.awayTeam.slug}`,
        matches: take(away.matches, 2),
      },
      {
        kind: "competition",
        name: match.competition.name,
        href: `/competitions/${match.competition.slug}`,
        matches: take(competition.matches, 3),
      },
    );

    relatedSummaries = await getCheapestOffersForFixtures(
      related.flatMap((group) => group.matches),
    );
  }

  return (
    <>
      <MatchHeroCard
        match={match}
        aside={availability === "available" ? <MatchOfferStats offers={offers} /> : undefined}
      />

      <div className="container-page pb-20 pt-10 sm:pb-28 sm:pt-14">
        {match.status === "postponed" && (
          <p className="mb-8 rounded-card bg-signal px-4 py-3 text-[15px] font-medium text-ink">
            {t("postponedNotice")}
          </p>
        )}

        {/* The comparison heading would contradict the empty state, so with
            nothing to compare the empty slot carries the section on its own. */}
        {availability === "available" ? (
          <section id="offers" className="scroll-mt-24">
            <h2 className="font-display text-[44px] text-ink sm:text-[64px]">
              {tOffers("title")}
            </h2>
            <p className="mb-8 mt-3 max-w-xl text-[16px] text-ink-muted sm:mb-10">
              {tOffers("subtitle")}
            </p>
            <TicketComparison offers={offers} initialTickets={sp.tickets} />
          </section>
        ) : (
          <>
            <EmptyOffers availability={availability} />
            <RelatedMatches groups={related} offersSummaries={relatedSummaries} />
          </>
        )}
      </div>
    </>
  );
}
