import type { Match } from "@/types/football";
import season from "./data/ligue-1-2026-27.json";
import { clubs, competitions, stadiums } from "./referenceData";
import { buildCompactSeason, type CompactSeedFixture } from "./compactSeason";

/**
 * The Ligue 1 McDonald's 2026/27 season, built from the league's published
 * calendar (see scripts/import-ligue-1-fixtures.ts).
 *
 * All 306 fixtures are represented, completed ones included — the provider
 * decides what is *discoverable*, this module only says what exists.
 */

/**
 * Home venues we can state from a verified source. ligue1.com's calendar
 * does not publish venues, so every other club's fixtures carry no stadium
 * and the UI says "Venue to be confirmed" rather than guessing one.
 */
const VERIFIED_HOME_VENUE: Record<string, keyof typeof stadiums> = {
  "Paris Saint-Germain": "parc_des_princes",
  "Olympique de Marseille": "velodrome",
  "AS Monaco": "louis_ii",
};

export const LIGUE_1_SEASON = season.season;
export const LIGUE_1_SOURCE = season.source;

export const ligue1Matches: Match[] = buildCompactSeason({
  fixtures: season.fixtures as CompactSeedFixture[],
  competition: competitions.ligue_1,
  country: "France",
  clubs,
  stadiums,
  verifiedHomeVenue: VERIFIED_HOME_VENUE,
  importedAt: season.importedAt,
  label: "Ligue 1",
});
