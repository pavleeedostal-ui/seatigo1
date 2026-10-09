import type { Match, StageCalendarEntry } from "@/types/football";
import season from "./data/champions-league-2026-27.json";
import { competitions } from "./referenceData";
import { buildUefaSeason, type UefaSeed } from "./uefaSeason";

/**
 * The UEFA Champions League 2026/27 season, built from UEFA's own match and
 * round services (see scripts/import-champions-league-fixtures.ts).
 *
 * Everything structural is in uefaSeason.ts, which the Europa League shares.
 * What is here is only what is true of this competition: which seed, which
 * Competition record, and where the final is played.
 */
const built = buildUefaSeason({
  seed: season as unknown as UefaSeed,
  competition: competitions.champions_league,
  slugTag: "ucl",
  label: "Champions League",
  /**
   * Confirmed by UEFA when it awarded the match; the round feed carries
   * dates only. It is the same ground Atlético play their league football
   * on, so it reuses that record rather than becoming a second stadium.
   * Only the name differs: the final is a UEFA event at a neutral venue,
   * billed without the club's naming-rights sponsor.
   */
  finalVenue: { stadium: "metropolitano", name: "Estadio Metropolitano" },
});

export const CHAMPIONS_LEAGUE_SEASON = built.season;
export const CHAMPIONS_LEAGUE_SOURCE_URL = built.source;

export const championsLeagueMatches: Match[] = built.matches;

/** The published calendar for every round, drawn or not, in playing order. */
export const CHAMPIONS_LEAGUE_STAGES: StageCalendarEntry[] = built.stages;
