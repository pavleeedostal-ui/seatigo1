import type {
  Competition,
  CompetitionStage,
  Match,
  MatchStatus,
  Stadium,
  StageCalendarEntry,
} from "@/types/football";
import { clubs, stadiums } from "./referenceData";

/**
 * Shared builder for UEFA club competitions seeded from UEFA's own match and
 * round services.
 *
 * The Champions League and the Europa League are the same competition shape:
 * a 36-club league phase of eight matchdays, then a two-legged knockout
 * bracket ending in a single-match final. They differ only in their
 * reference data, so everything structural lives here and each competition
 * contributes a source module of lookup tables plus a thin season module.
 *
 * The important property this file preserves is that **fixtures and the
 * stage calendar are separate**. A knockout round is on UEFA's calendar with
 * confirmed dates months before its draw, so `fixtures` holds only matches
 * that genuinely exist while `stages` holds every round, drawn or not. No
 * placeholder club is ever created.
 */

/** One stage of the season's published calendar, drawn or not. */
export interface SeedStage {
  stage: CompetitionStage;
  externalRoundId: string;
  name: string;
  order: number;
  dateFrom: string;
  dateTo: string;
  legs: 1 | 2;
  teamCount: number;
  drawn: boolean;
}

/** One fixture as written to the seed. Club and venue are Seatigo keys. */
export interface SeedFixture {
  externalFixtureId: string;
  stage: CompetitionStage;
  /** League-phase matchday. Null in a knockout round. */
  matchday: number | null;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  kickoffTime: string | null;
  stadium: string | null;
  finished: boolean;
  /** UEFA's own status, kept so a postponement is not flattened away. */
  status: string;
  tie: {
    tieId: string;
    leg: 1 | 2 | null;
    aggregate: { home: number; away: number } | null;
    /** Seatigo club key of the side that went through, once decided. */
    winner: string | null;
  } | null;
}

export interface UefaSeed {
  season: string;
  competition: string;
  source: string;
  importedAt: string;
  stages: SeedStage[];
  fixtures: SeedFixture[];
}

/**
 * UEFA round name -> Seatigo stage, across every UEFA club competition.
 *
 * The two competitions name the same round differently ("Knockout Round
 * Play-Offs" / "Knock-out Play-off"), so every spelling we have seen is
 * listed. An unmapped round stops the import rather than being guessed at.
 */
export const STAGE_BY_UEFA_ROUND: Record<string, CompetitionStage | undefined> = {
  "First qualifying round": "qualifying",
  "Second qualifying round": "qualifying",
  "Third qualifying round": "qualifying",
  // UEFA's "Play-Offs" is the final qualifying round, played before the
  // league phase — not the knockout play-off that follows it.
  "Play-Offs": "qualifying",
  "League Phase": "league_phase",
  "Knockout Round Play-Offs": "knockout_playoff",
  "Knock-out Play-off": "knockout_playoff",
  "Round of 16": "round_of_16",
  "Quarter-finals": "quarter_final",
  "Semi-finals": "semi_final",
  Final: "final",
};

const STAGE_SLUG: Record<CompetitionStage, string> = {
  qualifying: "qualifying",
  league_phase: "league-phase",
  knockout_playoff: "knockout-play-offs",
  round_of_16: "round-of-16",
  quarter_final: "quarter-finals",
  semi_final: "semi-finals",
  final: "final",
};

/** URL segment for a stage, e.g. "round-of-16". */
export function stageSlug(stage: CompetitionStage): string {
  return STAGE_SLUG[stage];
}

export function stageFromSlug(slug: string): CompetitionStage | null {
  const found = (Object.entries(STAGE_SLUG) as [CompetitionStage, string][]).find(
    ([, value]) => value === slug,
  );
  return found ? found[0] : null;
}

function statusFor(fixture: SeedFixture): MatchStatus {
  switch (fixture.status) {
    case "FINISHED":
      return "finished";
    case "LIVE":
      return "live";
    case "POSTPONED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      break;
  }
  // A slot that has already passed without UEFA marking it played is still
  // history as far as discovery is concerned.
  if (fixture.kickoffTime && new Date(fixture.kickoffTime).getTime() < Date.now()) {
    return "finished";
  }
  return "scheduled";
}

export interface UefaSeasonInput {
  seed: UefaSeed;
  competition: Competition;
  /** Short competition tag used in fixture slugs, e.g. "ucl". */
  slugTag: string;
  /** Name used in error messages, e.g. "Champions League". */
  label: string;
  /**
   * The final's venue, where UEFA has awarded it ahead of the draw. The
   * round feed carries dates only, so it is stated by the season module.
   * `name` overrides the stored record for this one match — UEFA drops
   * naming-rights titles for its own showpiece at a neutral venue.
   */
  finalVenue?: { stadium: keyof typeof stadiums; name?: string } | null;
}

export interface UefaSeasonResult {
  matches: Match[];
  stages: StageCalendarEntry[];
  season: string;
  source: string;
}

export function buildUefaSeason(input: UefaSeasonInput): UefaSeasonResult {
  const { seed, competition, slugTag, label } = input;

  /**
   * A fixture slug must identify one fixture across the whole database, and
   * these are the competitions whose clubs also play each other elsewhere:
   * without a qualifier, a European tie between two Spanish clubs would
   * collide with their La Liga meeting, and the same pair meeting again in
   * a later round would collide with itself.
   */
  function slugFor(fixture: SeedFixture, homeSlug: string, awaySlug: string): string {
    const base = `${homeSlug}-vs-${awaySlug}-${slugTag}`;
    return fixture.stage === "league_phase"
      ? base
      : `${base}-${STAGE_SLUG[fixture.stage]}`;
  }

  function toMatch(fixture: SeedFixture): Match {
    const home = clubs[fixture.homeTeam];
    const away = clubs[fixture.awayTeam];
    if (!home || !away) {
      throw new Error(
        `${label} season references an unknown club: ` +
          `${fixture.homeTeam} v ${fixture.awayTeam}`,
      );
    }

    const stadium = fixture.stadium ? (stadiums[fixture.stadium] ?? null) : null;
    if (fixture.stadium && !stadium) {
      throw new Error(`${label} season references an unknown venue: ${fixture.stadium}`);
    }

    return {
      // UEFA's own match id, which survives a reschedule — so moving a
      // fixture updates it in place rather than creating a second one.
      id: fixture.externalFixtureId,
      externalFixtureId: fixture.externalFixtureId,
      slug: slugFor(fixture, home.slug, away.slug),
      competition,
      homeTeam: home,
      awayTeam: away,
      stadium,
      city: stadium?.city ?? home.city,
      // Where the match is played, which is not always the home club's own
      // country: UEFA has clubs in exile hosting abroad.
      country: stadium?.country ?? home.country,
      date: fixture.date,
      kickoffTime: fixture.kickoffTime,
      season: seed.season,
      matchweek: fixture.matchday,
      stage: fixture.stage,
      tie: fixture.tie
        ? {
            tieId: fixture.tie.tieId,
            leg: fixture.tie.leg,
            aggregate: fixture.tie.aggregate,
            winnerClubId: fixture.tie.winner ? (clubs[fixture.tie.winner]?.id ?? null) : null,
          }
        : null,
      status: statusFor(fixture),
      lastSyncedAt: seed.importedAt,
    };
  }

  function finalStadium(): Stadium | null {
    if (!input.finalVenue) return null;
    const base = stadiums[input.finalVenue.stadium];
    if (!base) {
      throw new Error(`${label}: unknown final venue ${input.finalVenue.stadium}`);
    }
    return input.finalVenue.name ? { ...base, name: input.finalVenue.name } : base;
  }

  function toStage(stage: SeedStage): StageCalendarEntry {
    return {
      stage: stage.stage,
      externalRoundId: stage.externalRoundId,
      name: stage.name,
      order: stage.order,
      dateFrom: stage.dateFrom,
      dateTo: stage.dateTo,
      legs: stage.legs,
      teamCount: stage.teamCount,
      drawn: stage.drawn,
      stadium: stage.stage === "final" ? finalStadium() : null,
    };
  }

  const matches = seed.fixtures.map(toMatch);

  // A duplicate slug would make one fixture unreachable, and the collision
  // it guards against only appears once two clubs meet in more than one
  // competition. Cheap to check, and it fails at import rather than in a page.
  const slugs = matches.map((m) => m.slug);
  if (new Set(slugs).size !== slugs.length) {
    const duplicate = slugs.find((s, i) => slugs.indexOf(s) !== i);
    throw new Error(`${label} produced a duplicate fixture slug: ${duplicate}`);
  }

  return {
    matches,
    stages: seed.stages.map(toStage),
    season: seed.season,
    source: seed.source,
  };
}
