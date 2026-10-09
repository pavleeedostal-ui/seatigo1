import type { MatchDateRange } from "@/lib/football";
import type { AvailabilityFilter } from "@/lib/fixtures/availability";
import type { OfferSortKey } from "@/types/ticketing";

/**
 * The full querystring state of the /matches search-results page: search
 * terms from the hero (q, date, tickets) plus the filters and sort applied
 * on the results themselves. Kept as one shape so the search summary bar,
 * the filters panel, and the page itself all build/read the same URL.
 */
export interface MatchesSearchState {
  q?: string;
  competition?: string;
  club?: string;
  city?: string;
  /** Competition country. Narrows discovery to one national football scene. */
  country?: string;
  date?: string;
  /** Defaults to "all": fixtures without offers are discoverable by default. */
  availability?: AvailabilityFilter;
  range?: MatchDateRange;
  maxPrice?: string;
  tickets?: string;
  category?: string;
  provider?: string;
  sort?: OfferSortKey;
}

export function buildMatchesQuery(state: MatchesSearchState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.competition) params.set("competition", state.competition);
  if (state.club) params.set("club", state.club);
  if (state.city) params.set("city", state.city);
  if (state.country) params.set("country", state.country);
  if (state.date) params.set("date", state.date);
  if (state.availability && state.availability !== "all")
    params.set("availability", state.availability);
  if (state.range && state.range !== "all") params.set("range", state.range);
  if (state.maxPrice) params.set("maxPrice", state.maxPrice);
  if (state.tickets && state.tickets !== "any") params.set("tickets", state.tickets);
  if (state.category && state.category !== "all") params.set("category", state.category);
  if (state.provider && state.provider !== "all") params.set("provider", state.provider);
  if (state.sort && state.sort !== "recommended") params.set("sort", state.sort);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
