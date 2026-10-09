import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { getOffersForFixture } from "@/lib/ticketing/aggregator";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { recordClubInterest } from "@/lib/analytics/club-popularity";
import { MatchHeroCard } from "@/components/matches/MatchHeroCard";
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

  return (
    <div className="container-page py-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted"
      >
        <Link href="/" className="hover:text-ink">
          {t("breadcrumbHome")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <Link
          href={`/competitions/${match.competition.slug}`}
          className="hover:text-ink"
        >
          {match.competition.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="text-ink">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </span>
      </nav>

      <MatchHeroCard match={match} />

      {match.status === "postponed" && (
        <p className="mt-6 rounded-card border border-border bg-background px-4 py-3 text-[14px] text-ink-muted">
          {t("postponedNotice")}
        </p>
      )}

      <div className="mt-12">
        {/* The comparison heading would contradict the empty state, so with
            nothing to compare the empty card carries the section on its own. */}
        {availability === "available" ? (
          <>
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
              {tOffers("title")}
            </h2>
            <p className="mt-2 mb-8 max-w-xl text-[15px] text-ink-muted">
              {tOffers("subtitle")}
            </p>
            <TicketComparison offers={offers} initialTickets={sp.tickets} />
          </>
        ) : (
          <EmptyOffers availability={availability} />
        )}
      </div>
    </div>
  );
}
