import type { clubs, stadiums } from "./referenceData";

/**
 * Everything the shared UEFA importer needs to know about one competition.
 *
 * The importer, the validator and the season builder are all competition-
 * agnostic; this is the only place a competition says what it is. Adding a
 * third UEFA competition means one more module of this shape and nothing
 * else.
 */
export interface UefaCompetitionSource {
  /** UEFA's own competition id — 1 for the Champions League, 14 for the Europa League. */
  uefaCompetitionId: string;
  /** UEFA labels a season by the year it ends in, so 2026/27 is "2027". */
  uefaSeasonYear: string;
  /** Seatigo's season label, e.g. "2026/27". */
  seasonLabel: string;
  /** Seatigo's competition slug, e.g. "europa-league". */
  competitionSlug: string;
  /** Short tag used in tie ids, e.g. "uel". */
  idPrefix: string;
  /** Human name used in log output and error messages. */
  label: string;
  /** The UEFA page a reader should check the data against. */
  sourceUrl: string;
  /** Filename under src/lib/football/data. */
  dataFile: string;
  /** UEFA official venue name -> Seatigo stadium key. */
  venues: Record<string, keyof typeof stadiums>;
  /** UEFA official club name -> Seatigo club key. */
  clubs: Record<string, keyof typeof clubs>;
}
