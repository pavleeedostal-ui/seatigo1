import type { Club } from "@/types/football";
import { CLUB_CRESTS } from "./club-logos";

/**
 * Resolves free text to exactly one club.
 *
 * This is what stops a club's traffic being split across the names people
 * type for it. "Man Utd", "Manchester United FC" and "manchester-united" are
 * one club with one id, because the lookup goes through the same curated
 * alias registry the crests use, and everything downstream counts by id.
 */

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
 * The club a search query is about, or null when it is about something else
 * (a city, a competition, or nothing we recognise).
 *
 * Exact matches only — on the club's name, short name, slug or a registered
 * alias. A query that merely contains a club's name ("arsenal tickets
 * london") is not counted, because a loose match would let one popular
 * substring inflate an unrelated club.
 */
export function resolveClubByQuery(query: string, clubs: Club[]): Club | null {
  const q = normalize(query);
  if (!q) return null;

  for (const club of clubs) {
    if (normalize(club.name) === q) return club;
    if (normalize(club.shortName) === q) return club;
    if (normalize(club.slug) === q) return club;
    const aliases = aliasesBySlug.get(club.slug);
    if (aliases?.some((alias) => normalize(alias) === q)) return club;
  }

  return null;
}
