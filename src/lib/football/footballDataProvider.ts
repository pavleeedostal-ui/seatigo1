import type {
  Club,
  Competition,
  Match,
  MatchStatus,
  Stadium,
} from "@/types/football";
import { fixtureSortKey, isUpcomingStatus } from "@/types/football";
import type {
  CompetitionGroup,
  FootballDataProvider,
  MatchFilters,
  MatchListResult,
} from "./types";

/**
 * Integration for https://www.football-data.org/ (v4 REST API).
 *
 * This only ever supplies fixtures, teams and competitions — Seatigo is a
 * ticket comparison platform, so pricing and availability always come from
 * the ticketing layer (src/lib/ticketing), never from the fixture source.
 *
 * Set FOOTBALL_DATA_PROVIDER=football-data and FOOTBALL_DATA_API_KEY in
 * .env.local to activate this provider (see .env.example).
 */

const BASE_URL =
  process.env.FOOTBALL_DATA_API_BASE_URL ?? "https://api.football-data.org/v4";

const COMPETITION_CODES: Record<string, { slug: string; color: string }> = {
  PL: { slug: "premier-league", color: "#3D195B" },
  PD: { slug: "la-liga", color: "#EE8707" },
  SA: { slug: "serie-a", color: "#008FD7" },
  BL1: { slug: "bundesliga", color: "#D20515" },
  FL1: { slug: "ligue-1", color: "#0A2B5E" },
  CL: { slug: "champions-league", color: "#0E1E5B" },
  EL: { slug: "europa-league", color: "#F97316" },
};

interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface FdCompetition {
  code: string;
  name: string;
  area: { name: string };
  emblem: string;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  season?: { startDate?: string; endDate?: string };
  matchday?: number | null;
  competition: FdCompetition;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toClub(team: FdTeam): Club {
  return {
    id: `fd-${team.id}`,
    slug: slugifyName(team.shortName || team.name),
    name: team.name,
    shortName: team.shortName || team.tla,
    city: "",
    country: "",
    logo: team.crest,
  };
}

function toCompetition(comp: FdCompetition): Competition {
  const known = COMPETITION_CODES[comp.code];
  return {
    id: comp.code,
    slug: known?.slug ?? slugifyName(comp.name),
    name: comp.name,
    shortName: comp.code,
    country: comp.area?.name ?? "Europe",
    logo: comp.emblem,
    color: known?.color ?? "#0E1E5B",
  };
}

/** "2026-08-21".."2027-05-30" → "2026/27". */
function toSeasonLabel(season: FdMatch["season"]): string | null {
  const start = season?.startDate?.slice(0, 4);
  if (!start) return null;
  return `${start}/${String((Number(start) + 1) % 100).padStart(2, "0")}`;
}

/** football-data.org status → Seatigo status. Unknown values stay scheduled. */
function toStatus(status: string): MatchStatus {
  switch (status) {
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "POSTPONED":
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function toMatch(fdMatch: FdMatch): Match {
  const home = toClub(fdMatch.homeTeam);
  const away = toClub(fdMatch.awayTeam);
  const competition = toCompetition(fdMatch.competition);
  // football-data.org does not expose venues or club cities on its free
  // tier. Rather than inventing them, the fixture carries no venue and the
  // UI says "Venue to be confirmed" (see Match.stadium).
  const stadium: Stadium | null = null;
  const city: string | null = home.city || null;

  // The API marks an unscheduled fixture with a placeholder midnight date;
  // treat a bare date as "time TBC" instead of claiming a 00:00 kickoff.
  const utc = fdMatch.utcDate ?? null;
  const timeConfirmed = Boolean(utc) && !utc.endsWith("T00:00:00Z");

  return {
    id: `fd-match-${fdMatch.id}`,
    externalFixtureId: String(fdMatch.id),
    slug: `${home.slug}-vs-${away.slug}`,
    competition,
    homeTeam: home,
    awayTeam: away,
    stadium,
    city,
    country: home.country || competition.country,
    date: utc ? utc.slice(0, 10) : null,
    kickoffTime: timeConfirmed ? utc : null,
    season: toSeasonLabel(fdMatch.season),
    matchweek: fdMatch.matchday ?? null,
    status: toStatus(fdMatch.status),
    lastSyncedAt: new Date().toISOString(),
  };
}

async function fdFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FOOTBALL_DATA_API_KEY is not set. See .env.example to configure the live provider.",
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`football-data.org request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Filters the API cannot express are applied here, on normalized fixtures. */
function applyFilters(match: Match, filters: MatchFilters): boolean {
  if (filters.country && match.competition.country !== filters.country) return false;
  if (
    filters.club &&
    match.homeTeam.slug !== filters.club &&
    match.awayTeam.slug !== filters.club
  )
    return false;
  if (filters.city && match.city?.toLowerCase() !== filters.city.toLowerCase())
    return false;
  if (filters.date && match.date !== filters.date) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack = [
      match.homeTeam.name,
      match.awayTeam.name,
      match.competition.name,
      match.competition.country,
      match.city ?? "",
      match.stadium?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export class FootballDataOrgProvider implements FootballDataProvider {
  async getUpcomingMatches(limit = 8): Promise<Match[]> {
    const { matches } = await this.getMatches({ pageSize: limit });
    return matches;
  }

  async getMatches(filters: MatchFilters): Promise<MatchListResult> {
    const codes = filters.competition
      ? Object.entries(COMPETITION_CODES).find(
          ([, v]) => v.slug === filters.competition,
        )?.[0]
      : undefined;

    // SCHEDULED|TIMED covers announced fixtures; POSTPONED ones are still
    // upcoming for a fan, so they are requested too and filtered below.
    const query = "status=SCHEDULED,TIMED,POSTPONED";
    const path = codes
      ? `/competitions/${codes}/matches?${query}`
      : `/matches?${query}`;

    const data = await fdFetch<{ matches: FdMatch[] }>(path);
    const all = data.matches
      .map(toMatch)
      .filter((m) => isUpcomingStatus(m.status))
      .filter((m) => applyFilters(m, filters))
      .sort((a, b) => fixtureSortKey(a).localeCompare(fixtureSortKey(b)));
    const total = all.length;
    const pageSize = filters.pageSize ?? total;
    const page = filters.page ?? 1;
    const start = (page - 1) * pageSize;

    return { matches: all.slice(start, start + pageSize), total };
  }

  async getMatchBySlug(slug: string): Promise<Match | null> {
    const { matches } = await this.getMatches({ pageSize: 200 });
    return matches.find((m) => m.slug === slug) ?? null;
  }

  async getMatchById(id: string): Promise<Match | null> {
    const { matches } = await this.getMatches({ pageSize: 200 });
    return matches.find((m) => m.id === id) ?? null;
  }

  async getCompetitions(): Promise<Competition[]> {
    const data = await fdFetch<{ competitions: FdCompetition[] }>(
      "/competitions",
    );
    return data.competitions
      .filter((c) => COMPETITION_CODES[c.code])
      .map(toCompetition);
  }

  /**
   * football-data.org exposes rounds only as a label on each match, with no
   * calendar for a round that has not been drawn — so there is nothing
   * honest to return here. Competitions served by this provider render as
   * flat fixture lists rather than showing an invented bracket.
   */
  async getStageCalendar(): Promise<null> {
    return null;
  }

  async getCompetitionBySlug(slug: string): Promise<Competition | null> {
    const competitions = await this.getCompetitions();
    return competitions.find((c) => c.slug === slug) ?? null;
  }

  async getCompetitionsByCountry(): Promise<CompetitionGroup[]> {
    const competitions = await this.getCompetitions();
    const groups = new Map<string, Competition[]>();
    for (const competition of competitions) {
      const list = groups.get(competition.country) ?? [];
      list.push(competition);
      groups.set(competition.country, list);
    }
    return Array.from(groups.entries())
      .map(([country, list]) => ({
        country,
        competitions: list.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }

  async getClubs(): Promise<Club[]> {
    const { matches } = await this.getMatches({ pageSize: 200 });
    const map = new Map<string, Club>();
    for (const m of matches) {
      map.set(m.homeTeam.slug, m.homeTeam);
      map.set(m.awayTeam.slug, m.awayTeam);
    }
    return Array.from(map.values());
  }

  async getClubBySlug(slug: string): Promise<Club | null> {
    const clubs = await this.getClubs();
    return clubs.find((c) => c.slug === slug) ?? null;
  }

  async getCities(): Promise<string[]> {
    const { matches } = await this.getMatches({ pageSize: 200 });
    return Array.from(
      new Set(matches.flatMap((m) => (m.city ? [m.city] : []))),
    ).sort();
  }

  async getCountries(): Promise<string[]> {
    const competitions = await this.getCompetitions();
    return Array.from(new Set(competitions.map((c) => c.country))).sort();
  }
}
