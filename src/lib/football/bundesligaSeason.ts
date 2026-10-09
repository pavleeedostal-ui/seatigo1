import type { Match } from "@/types/football";
import season from "./data/bundesliga-2026-27.json";
import { clubs, competitions, stadiums } from "./referenceData";
import { buildCompactSeason, type CompactSeedFixture } from "./compactSeason";

/**
 * The Bundesliga 2026/27 season, built from the league's published matchday
 * pages (see scripts/import-bundesliga-fixtures.ts).
 *
 * All 306 fixtures are represented, completed ones included — the provider
 * decides what is *discoverable*, this module only says what exists.
 */

/**
 * Home venues we can state from a verified source. bundesliga.com's matchday
 * pages do not publish venues, so every other club's fixtures carry no
 * stadium and the UI says "Venue to be confirmed" rather than guessing one.
 */
const VERIFIED_HOME_VENUE: Record<string, keyof typeof stadiums> = {
  "FC Bayern München": "allianz_arena",
  "Borussia Dortmund": "signal_iduna_park",
  "RB Leipzig": "red_bull_arena_leipzig",
};

export const BUNDESLIGA_SEASON = season.season;
export const BUNDESLIGA_SOURCE = season.source;

export const bundesligaMatches: Match[] = buildCompactSeason({
  fixtures: season.fixtures as CompactSeedFixture[],
  competition: competitions.bundesliga,
  country: "Germany",
  clubs,
  stadiums,
  verifiedHomeVenue: VERIFIED_HOME_VENUE,
  importedAt: season.importedAt,
  label: "Bundesliga",
});
