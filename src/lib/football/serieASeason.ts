import type { Match, MatchStatus } from "@/types/football";
import season from "./data/serie-a-2026-27.json";
import { clubs, competitions, stadiums } from "./referenceData";

/**
 * The Serie A Enilive 2026/27 season, built from Lega Serie A's published
 * schedule (see scripts/import-serie-a-fixtures.ts).
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
  finished: boolean;
}

const clubByName = new Map(Object.values(clubs).map((club) => [club.name, club]));

/**
 * Home venues we can state from a verified source. Lega Serie A's schedule
 * does not publish venues, so every other club's fixtures carry no stadium
 * and the UI says "Venue to be confirmed" rather than guessing one.
 */
const VERIFIED_HOME_VENUE: Record<string, keyof typeof stadiums> = {
  "Inter Milan": "san_siro",
  "AC Milan": "san_siro",
  "Juventus FC": "allianz_stadium_turin",
  "SSC Napoli": "maradona",
  "AS Roma": "olimpico",
};

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
      `Serie A season references an unknown club: ${fixture.homeTeam} v ${fixture.awayTeam}`,
    );
  }

  const venueKey = VERIFIED_HOME_VENUE[fixture.homeTeam];
  const stadium = venueKey ? stadiums[venueKey] : null;

  return {
    // Stable and derived from the pairing, so a reschedule never creates a
    // new fixture — see scripts/sync-fixtures.ts.
    id: fixture.externalFixtureId,
    externalFixtureId: fixture.externalFixtureId,
    slug: `${home.slug}-vs-${away.slug}`,
    competition: competitions.serie_a,
    homeTeam: home,
    awayTeam: away,
    stadium,
    city: stadium?.city ?? home.city,
    country: "Italy",
    date: fixture.date,
    kickoffTime: fixture.kickoffTime,
    nominalDate: fixture.nominalDate,
    season: fixture.season,
    matchweek: fixture.matchweek,
    status: statusFor(fixture),
    lastSyncedAt: season.importedAt,
  };
}

export const SERIE_A_SEASON = season.season;
export const SERIE_A_SOURCE = season.source;

export const serieAMatches: Match[] = (season.fixtures as SeedFixture[]).map(toMatch);
