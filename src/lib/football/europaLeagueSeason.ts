import type { Match, StageCalendarEntry } from "@/types/football";
import season from "./data/europa-league-2026-27.json";
import { competitions } from "./referenceData";
import { buildUefaSeason, type UefaSeed } from "./uefaSeason";

/**
 * The UEFA Europa League 2026/27 season, built from UEFA's own match and
 * round services (see scripts/import-europa-league-fixtures.ts).
 *
 * Everything structural is in uefaSeason.ts, shared with the Champions
 * League. What is here is only what is true of this competition.
 *
 * `finalVenue` is deliberately absent. UEFA's round feed carries dates for
 * the 26 May 2027 final but no venue, and no host has been published there,
 * so the stage shows its confirmed date with no ground rather than a
 * guessed one. Fill it in the moment UEFA announces the host — see
 * docs/europa-league-import.md.
 */
const built = buildUefaSeason({
  seed: season as unknown as UefaSeed,
  competition: competitions.europa_league,
  slugTag: "uel",
  label: "Europa League",
  finalVenue: null,
});

export const EUROPA_LEAGUE_SEASON = built.season;
export const EUROPA_LEAGUE_SOURCE_URL = built.source;

export const europaLeagueMatches: Match[] = built.matches;

/** The published calendar for every round, drawn or not, in playing order. */
export const EUROPA_LEAGUE_STAGES: StageCalendarEntry[] = built.stages;
