import type { Club, Competition, Match, MatchStatus, Stadium } from "@/types/football";

/**
 * Shared builder for seasons seeded from a compact extract (Ligue 1,
 * Bundesliga). Identical in shape and behaviour to the per-league season
 * modules for the Premier League, La Liga and Serie A — factored out because
 * these two differ only in their reference data.
 */
export interface CompactSeedFixture {
  externalFixtureId: string;
  season: string;
  matchweek: number;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  kickoffTime: string | null;
  nominalDate: string | null;
  finished: boolean;
}

export function buildCompactSeason(input: {
  fixtures: CompactSeedFixture[];
  competition: Competition;
  country: string;
  clubs: Record<string, Club>;
  stadiums: Record<string, Stadium>;
  verifiedHomeVenue: Record<string, string>;
  importedAt: string;
  label: string;
}): Match[] {
  const byName = new Map(Object.values(input.clubs).map((c) => [c.name, c]));

  return input.fixtures.map((fixture) => {
    const home = byName.get(fixture.homeTeam);
    const away = byName.get(fixture.awayTeam);
    if (!home || !away) {
      throw new Error(
        `${input.label} season references an unknown club: ${fixture.homeTeam} v ${fixture.awayTeam}`,
      );
    }

    const venueKey = input.verifiedHomeVenue[fixture.homeTeam];
    const stadium = venueKey ? (input.stadiums[venueKey] ?? null) : null;

    const status: MatchStatus =
      fixture.finished ||
      (fixture.kickoffTime && new Date(fixture.kickoffTime).getTime() < Date.now())
        ? "finished"
        : "scheduled";

    return {
      // Stable and derived from the pairing (or the provider's own id), so a
      // reschedule never creates a new fixture — see scripts/sync-fixtures.ts.
      id: fixture.externalFixtureId,
      externalFixtureId: fixture.externalFixtureId,
      slug: `${home.slug}-vs-${away.slug}`,
      competition: input.competition,
      homeTeam: home,
      awayTeam: away,
      stadium,
      city: stadium?.city ?? home.city,
      country: input.country,
      date: fixture.date,
      kickoffTime: fixture.kickoffTime,
      nominalDate: fixture.nominalDate,
      season: fixture.season,
      matchweek: fixture.matchweek,
      status,
      lastSyncedAt: input.importedAt,
    };
  });
}
