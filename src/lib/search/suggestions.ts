import { getFootballDataProvider } from "@/lib/football";
import { CLUB_CRESTS, resolveClubCrest } from "@/lib/football/club-logos";
import { resolveCompetitionLogo } from "@/lib/football/competition-logos";

/**
 * What the one search box can find: a club, a competition, or a city.
 *
 * Each suggestion carries the filter it maps to, not just its text, so
 * picking "Arsenal" narrows by club id rather than re-running a free-text
 * search. Typing and pressing Enter still falls back to `q`.
 */
export type SuggestionKind = "club" | "competition" | "city";

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
 * Ranks a candidate against the query: 0 is no match, higher is better.
 * A prefix match beats a word-boundary match, which beats a substring —
 * so "man" offers Manchester City before Bayern München.
 */
function rank(haystack: string, needle: string): number {
  if (!haystack.includes(needle)) return 0;
  if (haystack.startsWith(needle)) return 3;
  if (haystack.includes(` ${needle}`)) return 2;
  return 1;
}

export const SUGGESTIONS_PER_KIND = 5;

/**
 * Suggestions for a query, grouped by kind and capped per group so one
 * crowded category cannot push the others off the list.
 *
 * Everything comes from the live fixture database — there is no separate
 * search index to drift out of sync.
 */
export async function getSearchSuggestions(
  query: string,
  perKind = SUGGESTIONS_PER_KIND,
): Promise<SearchSuggestion[]> {
  const q = normalize(query);
  if (q.length < 2) return [];

  const provider = getFootballDataProvider();
  const [clubs, competitions, cities] = await Promise.all([
    provider.getClubs(),
    provider.getCompetitions(),
    provider.getCities(),
  ]);

  const clubHits = clubs
    .map((club) => {
      // Aliases let "spurs" find Tottenham, but the alias only decides
      // *whether* it matches — the label is always the club's full name.
      const score = Math.max(
        rank(normalize(club.name), q),
        rank(normalize(club.shortName), q),
        ...(aliasesBySlug.get(club.slug) ?? []).map((a) => rank(normalize(a), q)),
      );
      return { club, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.club.name.localeCompare(b.club.name))
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
        rank(normalize(competition.name), q),
        rank(normalize(competition.shortName), q),
      ),
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, perKind)
    .map<SearchSuggestion>(({ competition }) => ({
      kind: "competition",
      value: competition.slug,
      label: competition.name,
      hint: competition.country,
      logo: resolveCompetitionLogo(competition) ?? undefined,
    }));

  const cityHits = cities
    .map((city) => ({ city, score: rank(normalize(city), q) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.city.localeCompare(b.city))
    .slice(0, perKind)
    .map<SearchSuggestion>(({ city }) => ({
      kind: "city",
      value: city,
      label: city,
    }));

  return [...clubHits, ...competitionHits, ...cityHits];
}
