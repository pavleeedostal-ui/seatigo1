/**
 * A fixture exists in Seatigo whether or not anyone is selling tickets for
 * it. Nothing in this file may depend on the ticketing layer.
 */
export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Competition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  country: string;
  logo: string;
  color: string;
}

export interface Club {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  logo: string;
}

export interface Stadium {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  image?: string;
}

/**
 * Where a fixture sits in a competition whose season is not one flat
 * round-robin. Domestic leagues leave it unset and keep using `matchweek`
 * alone; UEFA competitions set it on every fixture.
 */
export type CompetitionStage =
  | "qualifying"
  | "league_phase"
  | "knockout_playoff"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

/** Knockout stages in the order they are played. */
export const KNOCKOUT_STAGES: readonly CompetitionStage[] = [
  "knockout_playoff",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
] as const;

export function isKnockoutStage(stage: CompetitionStage): boolean {
  return KNOCKOUT_STAGES.includes(stage);
}

/**
 * The tie a knockout fixture belongs to. Both legs of a tie share `tieId`,
 * so a two-legged tie can be presented as one thing even though it is two
 * fixtures with the home side swapped.
 *
 * Everything that is only known once the tie has been played is nullable:
 * a fixture is created when the draw is made, not when it is decided.
 */
export interface KnockoutTie {
  /** Stable across both legs, e.g. "ucl-2026-27-round_of_16-arsenal-v-inter". */
  tieId: string;
  /** 1 or 2. Null for a one-legged tie — the final is a single match. */
  leg: 1 | 2 | null;
  /** Aggregate score over the tie, home/away as of *this* leg. Null until played. */
  aggregate: { home: number; away: number } | null;
  /** Club id of the side that went through. Null until the tie is decided. */
  winnerClubId: string | null;
}

/**
 * A round that exists on the competition's published calendar whether or
 * not its draw has been made.
 *
 * This is what lets Seatigo show "Round of 16 · 9–17 March 2027 · Teams to
 * be confirmed" without inventing a matchup: the calendar is confirmed,
 * the participants are not, and the two are stored separately.
 */
export interface StageCalendarEntry {
  stage: CompetitionStage;
  /** The competition's own round id, for synchronisation. */
  externalRoundId: string;
  /** The organiser's name for the round, e.g. "Knockout Round Play-Offs". */
  name: string;
  /** Position in the season, ascending. */
  order: number;
  /** ISO dates bounding the round. */
  dateFrom: string;
  dateTo: string;
  legs: 1 | 2;
  teamCount: number;
  /**
   * True once the draw has been made and real fixtures exist. While false
   * the round is shown as calendar-only — never with placeholder clubs.
   */
  drawn: boolean;
  /**
   * Set only where the venue is awarded ahead of the draw, which in
   * practice means the final. Null everywhere else.
   */
  stadium: Stadium | null;
}

/**
 * A pure fixture: who's playing, where, and when. Seatigo never stores
 * pricing or availability on the fixture itself — that comes from ticket
 * providers via the aggregation layer (see src/lib/ticketing).
 *
 * `date` and `kickoffTime` are nullable on purpose. A fixture that has been
 * announced without a confirmed slot is a real fixture and stays
 * discoverable; we render "Date / Time TBC" rather than inventing a time.
 * Invariant: a non-null `kickoffTime` always implies a non-null `date`.
 */
export interface Match {
  id: string;
  /** The provider's own id. Internal ids never leak to ticket providers. */
  externalFixtureId: string;
  slug: string;
  competition: Competition;
  homeTeam: Club;
  awayTeam: Club;
  /** Null when the venue has not been confirmed (neutral ground, playoff). */
  stadium: Stadium | null;
  /** Falls back to the home club's city when the venue is unknown. */
  city: string | null;
  country: string;
  /** ISO date (YYYY-MM-DD), or null when the matchday is not fixed yet. */
  date: string | null;
  /** ISO datetime in UTC, or null when the kickoff slot is not confirmed. */
  kickoffTime: string | null;
  /**
   * True when `kickoffTime` comes from a competition's published default
   * rather than a confirmed listing, so the UI can say the time may move.
   */
  kickoffProvisional?: boolean;
  /**
   * The matchweek's nominal date, when the fixture itself has no confirmed
   * date. Used only to keep unscheduled fixtures in sensible order — it is
   * never displayed as a matchday.
   */
  nominalDate?: string | null;
  /** e.g. "2026/27". Null for competitions Seatigo tracks without a season. */
  season: string | null;
  /**
   * Round number within the stage — a league matchweek, or a league-phase
   * matchday in a UEFA competition. Null in a knockout round, where the tie
   * carries the ordering instead.
   */
  matchweek: number | null;
  /** Unset for a flat league season; set on every fixture of a staged one. */
  stage?: CompetitionStage | null;
  /** Set only on knockout fixtures. */
  tie?: KnockoutTie | null;
  status: MatchStatus;
  /** When Seatigo last refreshed this fixture from the football provider. */
  lastSyncedAt: string;
  featured?: boolean;
}

/** True when the fixture can still be attended — everything else is history. */
export function isUpcomingStatus(status: MatchStatus): boolean {
  return status === "scheduled" || status === "postponed";
}

/**
 * Sort key for fixtures. Fixtures without a confirmed date sort last rather
 * than being dropped, so they stay discoverable at the end of a list.
 */
export function fixtureSortKey(match: Match): string {
  if (match.kickoffTime) return match.kickoffTime;
  if (match.date) return `${match.date}T23:59:59Z`;
  // An unscheduled fixture still belongs in its matchweek's part of the list.
  if (match.nominalDate) return `${match.nominalDate}T23:59:59Z`;
  return "9999";
}
