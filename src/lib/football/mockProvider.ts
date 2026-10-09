import type { Club, Competition, Match, StageCalendarEntry } from "@/types/football";
import { fixtureSortKey, isUpcomingStatus } from "@/types/football";
import { clubs, competitions, matches } from "./mockData";
import { CHAMPIONS_LEAGUE_STAGES } from "./championsLeagueSeason";
import { EUROPA_LEAGUE_STAGES } from "./europaLeagueSeason";
import { CLUB_CRESTS } from "./club-logos";
import type {
  CompetitionGroup,
  FootballDataProvider,
  MatchFilters,
  MatchListResult,
} from "./types";

/**
 * Discoverable = still playable. Cancelled and finished fixtures drop out;
 * postponed ones stay, because a postponed match is still something a fan
 * is tracking. A fixture with no confirmed date cannot be "in the past",
 * so it stays in too.
 */
function isDiscoverable(match: Match): boolean {
  if (!isUpcomingStatus(match.status)) return false;
  if (!match.kickoffTime) return true;
  return new Date(match.kickoffTime).getTime() >= Date.now();
}

/** Accent- and punctuation-insensitive, so "Malaga" finds "Málaga CF". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Competitions whose season is a sequence of stages rather than one flat
 * league. A competition absent from here is a plain fixture list.
 */
const STAGE_CALENDARS: Record<string, StageCalendarEntry[] | undefined> = {
  "champions-league": CHAMPIONS_LEAGUE_STAGES,
  "europa-league": EUROPA_LEAGUE_STAGES,
};

/** Alternative names a club is known by, from the crest registry. */
const aliasesBySlug = new Map(CLUB_CRESTS.map((c) => [c.slug, c.aliases]));

function searchTermsFor(match: Match): string {
  return [
    match.homeTeam.name,
    match.homeTeam.shortName,
    ...(aliasesBySlug.get(match.homeTeam.slug) ?? []),
    match.awayTeam.name,
    match.awayTeam.shortName,
    ...(aliasesBySlug.get(match.awayTeam.slug) ?? []),
    match.competition.name,
    match.competition.shortName,
    match.competition.country,
    match.city ?? "",
    match.stadium?.name ?? "",
  ]
    .map(normalize)
    .join(" ");
}

function withinRange(match: Match, range: MatchFilters["range"]): boolean {
  if (!range || range === "all") return true;
  // A fixture with no confirmed kickoff cannot satisfy a date window; it is
  // only excluded when the user actively narrows to one.
  if (!match.kickoffTime) return false;

  const kickoff = new Date(match.kickoffTime);
  const diffDays = (kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  if (range === "weekend") {
    const day = kickoff.getUTCDay();
    return diffDays >= 0 && diffDays <= 8 && (day === 6 || day === 0);
  }
  if (range === "next7") return diffDays >= 0 && diffDays <= 7;
  if (range === "month") return diffDays >= 0 && diffDays <= 31;
  return true;
}

export class MockFootballDataProvider implements FootballDataProvider {
  async getUpcomingMatches(limit = 8): Promise<Match[]> {
    return matches
      .filter(isDiscoverable)
      .sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        return fixtureSortKey(a).localeCompare(fixtureSortKey(b));
      })
      .slice(0, limit);
  }

  async getMatches(filters: MatchFilters): Promise<MatchListResult> {
    let results = matches.filter(isDiscoverable);

    if (filters.competition) {
      results = results.filter(
        (m) => m.competition.slug === filters.competition,
      );
    }
    if (filters.country) {
      results = results.filter((m) => m.competition.country === filters.country);
    }
    if (filters.season) {
      results = results.filter((m) => m.season === filters.season);
    }
    if (filters.matchweek != null) {
      results = results.filter((m) => m.matchweek === filters.matchweek);
    }
    if (filters.stage) {
      results = results.filter((m) => m.stage === filters.stage);
    }
    if (filters.club) {
      results = results.filter(
        (m) => m.homeTeam.slug === filters.club || m.awayTeam.slug === filters.club,
      );
    }
    if (filters.city) {
      results = results.filter(
        (m) => m.city?.toLowerCase() === filters.city!.toLowerCase(),
      );
    }
    if (filters.query) {
      const q = normalize(filters.query);
      if (q) results = results.filter((m) => searchTermsFor(m).includes(q));
    }
    if (filters.date) {
      results = results.filter((m) => m.date === filters.date);
    }
    results = results.filter((m) => withinRange(m, filters.range));

    results = [...results].sort((a, b) =>
      fixtureSortKey(a).localeCompare(fixtureSortKey(b)),
    );

    const total = results.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? total;
    const start = (page - 1) * pageSize;

    return {
      matches: results.slice(start, start + pageSize),
      total,
    };
  }

  async getMatchBySlug(slug: string): Promise<Match | null> {
    return matches.find((m) => m.slug === slug) ?? null;
  }

  async getMatchById(id: string): Promise<Match | null> {
    return matches.find((m) => m.id === id) ?? null;
  }

  async getCompetitions(): Promise<Competition[]> {
    return Object.values(competitions);
  }

  async getCompetitionBySlug(slug: string): Promise<Competition | null> {
    return Object.values(competitions).find((c) => c.slug === slug) ?? null;
  }

  async getStageCalendar(competitionSlug: string): Promise<StageCalendarEntry[] | null> {
    return STAGE_CALENDARS[competitionSlug] ?? null;
  }

  async getCompetitionsByCountry(): Promise<CompetitionGroup[]> {
    const groups = new Map<string, Competition[]>();
    for (const competition of Object.values(competitions)) {
      const list = groups.get(competition.country) ?? [];
      list.push(competition);
      groups.set(competition.country, list);
    }
    return Array.from(groups.entries())
      .map(([country, list]) => ({
        country,
        competitions: list.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort(byCountry);
  }

  async getClubs(): Promise<Club[]> {
    return Object.values(clubs);
  }

  async getClubBySlug(slug: string): Promise<Club | null> {
    return Object.values(clubs).find((c) => c.slug === slug) ?? null;
  }

  async getCities(): Promise<string[]> {
    return Array.from(
      new Set(matches.filter(isDiscoverable).flatMap((m) => (m.city ? [m.city] : []))),
    ).sort();
  }

  async getCountries(): Promise<string[]> {
    return Array.from(
      new Set(Object.values(competitions).map((c) => c.country)),
    ).sort((a, b) => byCountry({ country: a }, { country: b }));
  }
}

/** Continental competitions list after domestic leagues, then alphabetically. */
function byCountry(a: { country: string }, b: { country: string }): number {
  if (a.country === "Europe") return 1;
  if (b.country === "Europe") return -1;
  return a.country.localeCompare(b.country);
}
