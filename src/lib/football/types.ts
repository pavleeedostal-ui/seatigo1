import type {
  Club,
  Competition,
  CompetitionStage,
  Match,
  StageCalendarEntry,
} from "@/types/football";

export type MatchDateRange = "all" | "weekend" | "next7" | "month";

/**
 * Fixture-only filters. Price, seat category and ticket availability are
 * ticket-offer concerns (see src/lib/ticketing) and are applied after
 * fixtures come back from here, once offers have been joined in.
 */
export interface MatchFilters {
  competition?: string;
  club?: string;
  city?: string;
  /** Competition country, e.g. "England". "Europe" covers UEFA competitions. */
  country?: string;
  /** Season label, e.g. "2026/27". */
  season?: string;
  /** Round within the season. */
  matchweek?: number;
  /** Stage of a staged competition, e.g. "league_phase". */
  stage?: CompetitionStage;
  query?: string;
  date?: string;
  range?: MatchDateRange;
  page?: number;
  pageSize?: number;
}

export interface MatchListResult {
  matches: Match[];
  total: number;
}

/** A country and the competitions Seatigo covers in it. */
export interface CompetitionGroup {
  country: string;
  competitions: Competition[];
}

export interface FootballDataProvider {
  getUpcomingMatches(limit?: number): Promise<Match[]>;
  getMatches(filters: MatchFilters): Promise<MatchListResult>;
  getMatchBySlug(slug: string): Promise<Match | null>;
  getMatchById(id: string): Promise<Match | null>;
  getCompetitions(): Promise<Competition[]>;
  /**
   * The published round calendar of a staged competition, or null for one
   * that is a flat league. Separate from fixtures on purpose: a knockout
   * round has confirmed dates long before it has teams.
   */
  getStageCalendar(competitionSlug: string): Promise<StageCalendarEntry[] | null>;
  getCompetitionBySlug(slug: string): Promise<Competition | null>;
  /** Competitions grouped by country, for Country → Competition browsing. */
  getCompetitionsByCountry(): Promise<CompetitionGroup[]>;
  getClubs(): Promise<Club[]>;
  getClubBySlug(slug: string): Promise<Club | null>;
  getCities(): Promise<string[]>;
  /** Countries that have at least one covered competition. */
  getCountries(): Promise<string[]>;
}
