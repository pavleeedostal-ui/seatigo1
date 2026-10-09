import type { Match, MatchStatus, Stadium } from "@/types/football";
import season from "./data/la-liga-2026-27.json";
import { clubs, competitions } from "./referenceData";

/**
 * The LALIGA EA SPORTS 2026/27 season, built from the league's own published
 * matchweek pages (see scripts/import-la-liga-fixtures.ts).
 *
 * All 380 fixtures are represented, completed ones included — the provider
 * decides what is *discoverable*, this module only says what exists.
 */

interface SeedFixture {
  externalFixtureId: string;
  season: string;
  matchweek: number;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  kickoffTime: string | null;
  nominalDate: string;
  venue: string | null;
  finished: boolean;
}

const clubByName = new Map(Object.values(clubs).map((club) => [club.name, club]));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * LALIGA publishes the venue name with every fixture, so a stadium here is
 * sourced, not guessed. The city comes from the home club, which is the only
 * part the feed does not carry.
 */
function venueFor(name: string | null, homeCity: string): Stadium | null {
  if (!name) return null;
  return {
    id: `venue-${slugify(name)}`,
    slug: slugify(name),
    name,
    city: homeCity,
    country: "Spain",
    capacity: 0,
  };
}

function statusFor(fixture: SeedFixture): MatchStatus {
  if (fixture.finished) return "finished";
  if (fixture.kickoffTime && new Date(fixture.kickoffTime).getTime() < Date.now()) {
    return "finished";
  }
  return "scheduled";
}

function toMatch(fixture: SeedFixture): Match {
  const home = clubByName.get(fixture.homeTeam);
  const away = clubByName.get(fixture.awayTeam);
  if (!home || !away) {
    throw new Error(
      `La Liga season references an unknown club: ${fixture.homeTeam} v ${fixture.awayTeam}`,
    );
  }

  const stadium = venueFor(fixture.venue, home.city);

  return {
    // Stable and derived from the pairing, so a reschedule never creates a
    // new fixture — see scripts/sync-fixtures.ts.
    id: fixture.externalFixtureId,
    externalFixtureId: fixture.externalFixtureId,
    slug: `${home.slug}-vs-${away.slug}`,
    competition: competitions.la_liga,
    homeTeam: home,
    awayTeam: away,
    stadium,
    city: stadium?.city ?? home.city,
    country: "Spain",
    date: fixture.date,
    kickoffTime: fixture.kickoffTime,
    nominalDate: fixture.nominalDate,
    season: fixture.season,
    matchweek: fixture.matchweek,
    status: statusFor(fixture),
    lastSyncedAt: season.importedAt,
  };
}

export const LA_LIGA_SEASON = season.season;
export const LA_LIGA_SOURCE = season.source;

export const laLigaMatches: Match[] = (season.fixtures as SeedFixture[]).map(toMatch);
