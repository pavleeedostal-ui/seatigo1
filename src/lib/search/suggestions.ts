import { getFootballDataProvider } from "@/lib/football";
import { CLUB_CRESTS, resolveClubCrest } from "@/lib/football/club-logos";
import { resolveCompetitionLogo } from "@/lib/football/competition-logos";
import { getClubPopularityIndex } from "@/lib/analytics/club-popularity";

/**
 * What the one search box can find: a club, a competition, or a city.
 *
 * Each suggestion carries the filter it maps to, not just its text, so
 * picking "Arsenal" narrows by club slug rather than re-running a free-text
 * search. Typing and pressing Enter still falls back to `q`.
 */
export type SuggestionKind = "club" | "competition" | "city";

/** The order groups appear in, most specific first. */
export const SUGGESTION_KIND_ORDER: readonly SuggestionKind[] = [
  "club",
  "competition",
  "city",
] as const;

export interface SearchSuggestion {
  kind: SuggestionKind;
  /** The value of the filter this suggestion sets. */
  value: string;
  label: string;
  /** Country for a club or competition, region for a city. */
  hint?: string;
  /** Crest or competition mark, already resolved to a served path. */
  logo?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const aliasesBySlug = new Map(CLUB_CRESTS.map((c) => [c.slug, c.aliases]));

/**
 * How well a candidate answers the query. Higher is better, 0 is no match.
 *
 * The ladder is deliberately coarse — five rungs, not a relevance score —
 * because the thing it has to get right is the *first* result. Someone who
 * types "inter" means Inter Milan, not Inter-anything-else, and an exact
 * name match has to outrank a substring hit however long the other name is.
 */
export const MATCH_SCORE = {
  /** The query is the whole name. */
  exact: 5,
  /** The query is exactly a name this club is also known by. */
  exactAlias: 4,
  /** The name begins with the query. */
  prefix: 3,
  /** Some later word in the name begins with the query. */
  wordPrefix: 2,
  /** The query appears somewhere inside. */
  substring: 1,
  none: 0,
} as const;

function scoreName(haystack: string, needle: string): number {
  if (!haystack) return MATCH_SCORE.none;
  if (haystack === needle) return MATCH_SCORE.exact;
  if (haystack.startsWith(needle)) return MATCH_SCORE.prefix;
  if (haystack.includes(` ${needle}`)) return MATCH_SCORE.wordPrefix;
  if (haystack.includes(needle)) return MATCH_SCORE.substring;
  return MATCH_SCORE.none;
}

/** An alias match is capped below a real-name match of the same strength. */
function scoreAlias(alias: string, needle: string): number {
  const base = scoreName(alias, needle);
  if (base === MATCH_SCORE.exact) return MATCH_SCORE.exactAlias;
  return base;
}

export const SUGGESTIONS_PER_KIND = 5;

/**
 * Suggestions for a query, grouped by kind and capped per group so one
 * crowded category cannot push the others off the list.
 *
 * Everything comes from the live fixture database — there is no separate
 * search index to drift out of sync.
 *
 * Ties are broken by measured club interest where there is enough of it,
 * and alphabetically otherwise. The popularity lookup is cached and returns
 * nothing until the analytics are traffic-backed, so search never inherits
 * a seeded editorial order (see lib/analytics/club-popularity.ts).
 */
export async function getSearchSuggestions(
  query: string,
  perKind = SUGGESTIONS_PER_KIND,
): Promise<SearchSuggestion[]> {
  const q = normalize(query);
  if (q.length < 2) return [];

  const provider = getFootballDataProvider();
  const [clubs, competitions, cities, popularity] = await Promise.all([
    provider.getClubs(),
    provider.getCompetitions(),
    provider.getCities(),
    getClubPopularityIndex(),
  ]);

  const clubHits = clubs
    .map((club) => {
      // Aliases decide *whether* a club matches, never what it is called:
      // the label is always the club's own full name.
      const score = Math.max(
        scoreName(normalize(club.name), q),
        scoreName(normalize(club.shortName), q),
        ...(aliasesBySlug.get(club.slug) ?? []).map((a) => scoreAlias(normalize(a), q)),
      );
      return { club, score, interest: popularity.get(club.id) ?? 0 };
    })
    .filter((hit) => hit.score > MATCH_SCORE.none)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.interest - a.interest ||
        a.club.name.localeCompare(b.club.name),
    )
    .slice(0, perKind)
    .map<SearchSuggestion>(({ club }) => ({
      kind: "club",
      value: club.slug,
      label: club.name,
      hint: club.country,
      logo: resolveClubCrest(club) ?? undefined,
    }));

  const competitionHits = competitions
    .map((competition) => ({
      competition,
      score: Math.max(
        scoreName(normalize(competition.name), q),
        scoreName(normalize(competition.shortName), q),
      ),
    }))
    .filter((hit) => hit.score > MATCH_SCORE.none)
    .sort(
      (a, b) =>
        b.score - a.score || a.competition.name.localeCompare(b.competition.name),
    )
    .slice(0, perKind)
    .map<SearchSuggestion>(({ competition }) => ({
      kind: "competition",
      value: competition.slug,
      label: competition.name,
      hint: competition.country,
      logo: resolveCompetitionLogo(competition) ?? undefined,
    }));

  const cityHits = cities
    .map((city) => ({ city, score: scoreName(normalize(city), q) }))
    .filter((hit) => hit.score > MATCH_SCORE.none)
    .sort((a, b) => b.score - a.score || a.city.localeCompare(b.city))
    .slice(0, perKind)
    .map<SearchSuggestion>(({ city }) => ({
      kind: "city",
      value: city,
      label: city,
    }));

  // Flattened in group order; the client re-splits them under headings and
  // navigates them as one list.
  return [...clubHits, ...competitionHits, ...cityHits];
}
