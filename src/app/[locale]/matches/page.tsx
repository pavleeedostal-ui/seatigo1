import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import type { MatchDateRange } from "@/lib/football";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary, OfferSortKey, SeatCategoryKey } from "@/types/ticketing";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import {
  getTicketAvailability,
  matchesAvailabilityFilter,
  type AvailabilityFilter,
} from "@/lib/fixtures/availability";
import { getActiveProviders } from "@/lib/ticketing/registry";
import { resolveClubByQuery } from "@/lib/football/clubLookup";
import { recordClubInterest } from "@/lib/analytics/club-popularity";
import { resolveCompetitionLogo } from "@/lib/football/competition-logos";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { MatchListRow } from "@/components/matches/MatchListRow";
import { MatchDateGroups } from "@/components/matches/MatchDateGroups";
import { MatchFiltersControls } from "@/components/matches/MatchFiltersDrawer";
import { SearchSummaryBar } from "@/components/matches/SearchSummaryBar";
import { EmptyState } from "@/components/matches/EmptyState";

interface SearchParams {
  q?: string;
  competition?: string;
  club?: string;
  city?: string;
  country?: string;
  date?: string;
  availability?: AvailabilityFilter;
  maxPrice?: string;
  tickets?: string;
  category?: string;
  provider?: string;
  sort?: OfferSortKey;
  range?: MatchDateRange;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.matches" });
  const path = "/matches";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
  };
}

function sortMatches(
  matches: Match[],
  summaries: Map<string, CheapestOfferSummary>,
  sort: OfferSortKey | undefined,
): Match[] {
  if (sort === "price_asc") {
    return [...matches].sort((a, b) => {
      const pa = summaries.get(a.id)?.lowestPrice;
      const pb = summaries.get(b.id)?.lowestPrice;
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
  }
  if (sort === "best_seats") {
    return [...matches].sort((a, b) => {
      const sa = summaries.get(a.id);
      const sb = summaries.get(b.id);
      const pa = sa?.hasPremiumSeating ? 0 : 1;
      const pb = sb?.hasPremiumSeating ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (sa?.lowestPrice ?? Infinity) - (sb?.lowestPrice ?? Infinity);
    });
  }
  // Recommended: keep the chronological order fixtures already come in.
  return matches;
}

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("Matches");

  const provider = getFootballDataProvider();
  const [{ matches: fixtures }, competitions, clubs, cities, countries] =
    await Promise.all([
      provider.getMatches({
        query: sp.q,
        competition: sp.competition,
        club: sp.club,
        city: sp.city,
        country: sp.country,
        date: sp.date,
        range: sp.range,
        pageSize: 120,
      }),
      provider.getCompetitions(),
      provider.getClubs(),
      provider.getCities(),
      provider.getCountries(),
    ]);
  const providers = getActiveProviders().map((entry) => entry.meta);

  // A search counts for a club only when the query *is* that club, resolved
  // through the shared alias registry — so "man utd" and "Manchester United"
  // both credit one club id rather than splitting its traffic.
  if (sp.q) {
    const searched = resolveClubByQuery(sp.q, clubs);
    if (searched) {
      recordClubInterest({ type: "club_search", clubIds: [searched.id] });
    }
  }

  // Price, tickets, category and seller are ticket-offer concerns, not
  // fixture ones — join in each fixture's offers, then filter afterwards.
  const offersSummaries = await getCheapestOffersForFixtures(fixtures);
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const minTickets = sp.tickets
    ? sp.tickets === "4+"
      ? 4
      : Number(sp.tickets)
    : undefined;

  const matches = fixtures.filter((m) => {
    const summary = offersSummaries.get(m.id);
    const availability = getTicketAvailability(m, Boolean(summary));

    // Availability is its own filter and defaults to "all", so a fixture
    // nobody is selling still shows up without the user opting in.
    if (!matchesAvailabilityFilter(availability, sp.availability)) return false;

    if (maxPrice && (!summary || summary.lowestPrice > maxPrice)) return false;
    if (minTickets && (!summary || summary.maxQuantityAvailable < minTickets)) return false;
    if (
      sp.category &&
      (!summary || !summary.categories.includes(sp.category as SeatCategoryKey))
    )
      return false;
    if (sp.provider && (!summary || !summary.providerIds.includes(sp.provider))) return false;
    return true;
  });

  const sortedMatches = sortMatches(matches, offersSummaries, sp.sort);
  // Date headings are shown only for the chronological sort.
  //
  // MatchDateGroups is safe under any order — it emits one group per date
  // whatever it is handed — but safety is not the same as usefulness here.
  // Asking for "lowest price" is asking for one list, cheapest first; split
  // into day buckets the cheapest fixture overall could sit halfway down the
  // page under its own heading. So the sort the user chose is honoured
  // literally, as a flat list, and grouping is reserved for the default
  // chronological view where the headings genuinely aid scanning.
  const groupedByDate = !sp.sort || sp.sort === "recommended";

  const filterOptions = {
    competitionOptions: competitions.map((c) => ({
      value: c.slug,
      label: c.name,
      // Resolved here so the filter stays a plain client component.
      logo: resolveCompetitionLogo(c) ?? undefined,
    })),
    clubOptions: clubs.map((c) => ({ value: c.slug, label: c.name })),
    cityOptions: cities.map((c) => ({ value: c, label: c })),
    countryOptions: countries.map((c) => ({ value: c, label: c })),
    providerOptions: providers.map((p) => ({ value: p.id, label: p.name })),
  };

  const searchState = {
    q: sp.q,
    competition: sp.competition,
    club: sp.club,
    city: sp.city,
    country: sp.country,
    date: sp.date,
    availability: sp.availability,
    maxPrice: sp.maxPrice,
    tickets: sp.tickets,
    category: sp.category,
    provider: sp.provider,
    sort: sp.sort,
    range: sp.range,
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">{t("subtitle")}</p>
      </div>

      <SearchSummaryBar state={searchState} />

      <div className="sticky top-18 z-30 -mx-5 mb-8 border-b border-border bg-white/90 px-5 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
        <MatchFiltersControls
          options={filterOptions}
          value={searchState}
          resultCount={sortedMatches.length}
        />
      </div>

      {sortedMatches.length === 0 ? (
        <EmptyState resetHref="/matches" />
      ) : groupedByDate ? (
        <MatchDateGroups
          matches={sortedMatches}
          offersSummaries={offersSummaries}
          tickets={sp.tickets}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sortedMatches.map((match) => (
            <MatchListRow
              key={match.id}
              match={match}
              offersSummary={offersSummaries.get(match.id) ?? null}
              tickets={sp.tickets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
