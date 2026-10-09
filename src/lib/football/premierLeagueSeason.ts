import type { Match, MatchStatus } from "@/types/football";
import season from "./data/premier-league-2026-27.json";
import { clubs, competitions, stadiums } from "./referenceData";

/**
 * The Premier League 2026/27 season, built from the league's own published
 * fixture list (see scripts/import-premier-league-fixtures.ts).
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
  date: string;
  kickoffTime: string;
  kickoffProvisional: boolean;
  broadcaster: string | null;
}

const clubByName = new Map(Object.values(clubs).map((club) => [club.name, club]));

/**
 * Home venues we can state from a verified source. The fixture list does not
 * publish venues, so every other club's fixtures carry no stadium and the UI
 * says "Venue to be confirmed" rather than guessing one.
 */
const VERIFIED_HOME_VENUE: Record<string, keyof typeof stadiums> = {
  Arsenal: "emirates",
  Chelsea: "stamford_bridge",
  Liverpool: "anfield",
  "Manchester City": "etihad",
  "Manchester United": "old_trafford",
  "Newcastle United": "st_james_park",
  "Tottenham Hotspur": "tottenham_hotspur",
};

/** A fixture whose kickoff has passed is history, not something to sell. */
function statusFor(kickoffTime: string): MatchStatus {
  return new Date(kickoffTime).getTime() < Date.now() ? "finished" : "scheduled";
}

function toMatch(fixture: SeedFixture): Match {
  const home = clubByName.get(fixture.homeTeam);
  const away = clubByName.get(fixture.awayTeam);
  if (!home || !away) {
    throw new Error(
      `Premier League season references an unknown club: ${fixture.homeTeam} v ${fixture.awayTeam}`,
    );
  }

  const venueKey = VERIFIED_HOME_VENUE[fixture.homeTeam];
  const stadium = venueKey ? stadiums[venueKey] : null;

  return {
    // Stable and derived from the pairing, so a kickoff change never creates
    // a new fixture — see scripts/sync-fixtures.ts.
    id: fixture.externalFixtureId,
    externalFixtureId: fixture.externalFixtureId,
    slug: `${home.slug}-vs-${away.slug}`,
    competition: competitions.premier_league,
    homeTeam: home,
    awayTeam: away,
    stadium,
    city: stadium?.city ?? home.city,
    country: "England",
    date: fixture.date,
    kickoffTime: fixture.kickoffTime,
    kickoffProvisional: fixture.kickoffProvisional,
    season: fixture.season,
    matchweek: fixture.matchweek,
    status: statusFor(fixture.kickoffTime),
    lastSyncedAt: season.importedAt,
  };
}

export const PREMIER_LEAGUE_SEASON = season.season;
export const PREMIER_LEAGUE_SOURCE = season.source;

export const premierLeagueMatches: Match[] = (season.fixtures as SeedFixture[]).map(
  toMatch,
);
