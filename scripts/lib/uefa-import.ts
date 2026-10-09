/**
 * Shared importer for UEFA club competitions, reading UEFA's own public
 * match and round services — the same ones uefa.com itself calls.
 *
 * Two things come back, and they are kept apart on purpose:
 *
 *   rounds   the published calendar for every stage of the season, which
 *            exists from the moment the competition is scheduled.
 *   matches  actual fixtures, which exist only once a draw has been made.
 *
 * A knockout round therefore has confirmed dates long before it has teams.
 * This writes the calendar for all of them and fixtures for only the rounds
 * that have been drawn, so the site can say "Round of 16, 9–17 March"
 * without ever naming a club that has not qualified.
 *
 * See docs/champions-league-import.md and docs/europa-league-import.md.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CompetitionStage } from "@/types/football";
import { STAGE_BY_UEFA_ROUND, type SeedFixture, type SeedStage, type UefaSeed } from "@/lib/football/uefaSeason";
import type { UefaCompetitionSource } from "@/lib/football/uefaSource";

const MATCH_API = "https://match.uefa.com/v5/matches";
const ROUND_API = "https://comp.uefa.com/v2/rounds";

/** Stages we take fixtures for. Qualifying is calendar-only — see the docs. */
const IMPORTED_STAGES = new Set<CompetitionStage>([
  "league_phase",
  "knockout_playoff",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
]);

/** Every UEFA league phase is 36 clubs over 8 matchdays. */
const LEAGUE_PHASE = {
  clubs: 36,
  matchdays: 8,
  fixtures: 144,
  homePerClub: 4,
  awayPerClub: 4,
} as const;

interface UefaTeam {
  id: string;
  internationalName: string;
  isPlaceHolder?: boolean;
  translations: { displayOfficialName: Record<string, string> };
}

interface UefaRound {
  id: string;
  metaData: { name: string };
  dateFrom: string;
  dateTo: string;
  orderInCompetition: number;
  teamCount: number;
  modeDetail: string;
}

interface UefaMatch {
  id: string;
  status: string;
  type: string;
  homeTeam: UefaTeam;
  awayTeam: UefaTeam;
  round: { id: string; metaData: { name: string } };
  matchday?: { sequenceNumber: string };
  kickOffTime?: { date?: string; dateTime?: string };
  stadium?: { translations: { officialName?: Record<string, string> } };
  leg?: { number: number };
  score?: { aggregate?: { home: number; away: number } };
  winner?: { aggregate?: { team?: UefaTeam } };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** The match service pages; keep asking until it stops giving us new ids. */
async function fetchAllMatches(source: UefaCompetitionSource): Promise<UefaMatch[]> {
  const byId = new Map<string, UefaMatch>();
  const pageSize = 100;

  for (let offset = 0; offset < 1000; offset += pageSize) {
    const page = await getJson<UefaMatch[]>(
      `${MATCH_API}?competitionId=${source.uefaCompetitionId}` +
        `&seasonYear=${source.uefaSeasonYear}&limit=${pageSize}&offset=${offset}`,
    );
    if (page.length === 0) break;
    for (const match of page) byId.set(match.id, match);
    if (page.length < pageSize) break;
  }

  return [...byId.values()];
}

function officialName(team: UefaTeam): string {
  return team.translations.displayOfficialName.EN ?? team.internationalName;
}

/**
 * Stable across both legs of a tie, and independent of which side is at
 * home, so the second leg joins the first instead of starting a new tie.
 */
function tieIdFor(
  source: UefaCompetitionSource,
  stage: CompetitionStage,
  homeSlug: string,
  awaySlug: string,
): string {
  const season = source.seasonLabel.replace("/", "-");
  return `${source.idPrefix}-${season}-${stage}-${[homeSlug, awaySlug].sort().join("-v-")}`;
}

function toSeedFixture(
  source: UefaCompetitionSource,
  match: UefaMatch,
  stage: CompetitionStage,
): SeedFixture {
  const home = officialName(match.homeTeam);
  const away = officialName(match.awayTeam);
  const homeSlug = source.clubs[home];
  const awaySlug = source.clubs[away];
  if (!homeSlug || !awaySlug) {
    throw new Error(
      `No Seatigo club for "${!homeSlug ? home : away}" (${stage}). Add it to ` +
        `referenceData.ts and this competition's club table before re-running.`,
    );
  }

  const venueName = match.stadium?.translations.officialName?.EN?.trim() ?? null;
  const stadium = venueName ? (source.venues[venueName] ?? null) : null;
  if (venueName && !stadium) {
    throw new Error(
      `No Seatigo stadium for UEFA venue "${venueName}". Add it to ` +
        `referenceData.ts and this competition's venue table before re-running.`,
    );
  }

  const knockout = stage !== "league_phase" && stage !== "qualifying";
  // Only the aggregate winner decides a tie; a single leg's winner does not.
  const winnerTeam = match.winner?.aggregate?.team;
  const winner = winnerTeam ? (source.clubs[officialName(winnerTeam)] ?? null) : null;

  return {
    externalFixtureId: `uefa-${match.id}`,
    stage,
    // A knockout fixture has no matchday; its tie carries the ordering.
    matchday: match.matchday ? Number(match.matchday.sequenceNumber) : null,
    homeTeam: homeSlug,
    awayTeam: awaySlug,
    date: match.kickOffTime?.date ?? null,
    kickoffTime: match.kickOffTime?.dateTime ?? null,
    stadium,
    finished: match.status === "FINISHED",
    status: match.status,
    tie: knockout
      ? {
          tieId: tieIdFor(source, stage, homeSlug, awaySlug),
          // A one-legged round (the final) reports no leg at all.
          leg: match.leg ? ((match.leg.number === 2 ? 2 : 1) as 1 | 2) : null,
          aggregate: match.score?.aggregate ?? null,
          winner,
        }
      : null,
  };
}

/** Structural invariants for the league phase. Nothing is written if these fail. */
function validateLeaguePhase(fixtures: SeedFixture[]): string[] {
  const problems: string[] = [];
  const phase = fixtures.filter((f) => f.stage === "league_phase");

  if (phase.length !== LEAGUE_PHASE.fixtures) {
    problems.push(`expected ${LEAGUE_PHASE.fixtures} fixtures, got ${phase.length}`);
  }

  const clubs = [...new Set(phase.flatMap((f) => [f.homeTeam, f.awayTeam]))];
  if (clubs.length !== LEAGUE_PHASE.clubs) {
    problems.push(`expected ${LEAGUE_PHASE.clubs} clubs, got ${clubs.length}`);
  }

  for (const club of clubs) {
    const home = phase.filter((f) => f.homeTeam === club).length;
    const away = phase.filter((f) => f.awayTeam === club).length;
    if (home !== LEAGUE_PHASE.homePerClub || away !== LEAGUE_PHASE.awayPerClub) {
      problems.push(`${club}: ${home} home / ${away} away`);
    }
  }

  const matchdays = [...new Set(phase.map((f) => f.matchday))].sort(
    (a, b) => (a ?? 0) - (b ?? 0),
  );
  if (matchdays.length !== LEAGUE_PHASE.matchdays) {
    problems.push(`expected ${LEAGUE_PHASE.matchdays} matchdays, got ${matchdays.length}`);
  }
  for (const matchday of matchdays) {
    const inDay = phase.filter((f) => f.matchday === matchday);
    const teams = new Set(inDay.flatMap((f) => [f.homeTeam, f.awayTeam]));
    if (inDay.length !== LEAGUE_PHASE.clubs / 2 || teams.size !== LEAGUE_PHASE.clubs) {
      problems.push(
        `matchday ${matchday}: ${inDay.length} fixtures, ${teams.size} distinct clubs`,
      );
    }
  }

  // In a league phase each club meets a different opponent every time, so a
  // repeated pairing in either direction is a defect.
  const seen = new Set<string>();
  for (const f of phase) {
    const key = [f.homeTeam, f.awayTeam].sort().join("|");
    if (seen.has(key)) problems.push(`repeated meeting: ${f.homeTeam} v ${f.awayTeam}`);
    seen.add(key);
    if (f.homeTeam === f.awayTeam) problems.push(`self fixture: ${f.homeTeam}`);
  }

  const ids = fixtures.map((f) => f.externalFixtureId);
  if (new Set(ids).size !== ids.length) problems.push("duplicate external fixture ids");

  return problems;
}

/** A drawn knockout round must be whole ties, not half of one. */
function validateKnockout(fixtures: SeedFixture[]): string[] {
  const problems: string[] = [];
  const byTie = new Map<string, SeedFixture[]>();
  for (const f of fixtures.filter((f) => f.tie)) {
    const list = byTie.get(f.tie!.tieId) ?? [];
    list.push(f);
    byTie.set(f.tie!.tieId, list);
  }

  for (const [tieId, legs] of byTie) {
    const expected = legs[0].stage === "final" ? 1 : 2;
    if (legs.length !== expected) {
      problems.push(`${tieId}: ${legs.length} leg(s), expected ${expected}`);
      continue;
    }
    if (expected === 2) {
      const numbers = legs.map((l) => l.tie!.leg).sort();
      if (numbers.join(",") !== "1,2") {
        problems.push(`${tieId}: legs numbered ${numbers.join(",")}`);
      }
      // The home side must swap between legs.
      if (legs[0].homeTeam === legs[1].homeTeam) {
        problems.push(`${tieId}: both legs at ${legs[0].homeTeam}`);
      }
    } else if (legs[0].tie!.leg !== null) {
      problems.push(`${tieId}: a final must not be numbered as a leg`);
    }
  }

  return problems;
}

export async function runUefaImport(source: UefaCompetitionSource): Promise<void> {
  const outFile = path.join(
    process.cwd(),
    "src",
    "lib",
    "football",
    "data",
    source.dataFile,
  );

  console.log(`Fetching UEFA ${source.label} ${source.seasonLabel}…`);

  const [rawRounds, rawMatches] = await Promise.all([
    getJson<UefaRound[]>(
      `${ROUND_API}?competitionId=${source.uefaCompetitionId}` +
        `&seasonYear=${source.uefaSeasonYear}`,
    ),
    fetchAllMatches(source),
  ]);

  console.log(`  ${rawRounds.length} rounds, ${rawMatches.length} matches`);

  const fixtures: SeedFixture[] = [];
  const skipped = new Map<string, number>();

  for (const match of rawMatches) {
    const stage = STAGE_BY_UEFA_ROUND[match.round.metaData.name];
    if (!stage) {
      throw new Error(
        `Unmapped UEFA round "${match.round.metaData.name}". Add it to ` +
          `STAGE_BY_UEFA_ROUND before re-running.`,
      );
    }
    if (!IMPORTED_STAGES.has(stage)) {
      skipped.set(stage, (skipped.get(stage) ?? 0) + 1);
      continue;
    }
    // A drawn fixture always has both clubs; UEFA uses placeholders in the
    // bracket before a draw, and those are not fixtures.
    if (match.homeTeam.isPlaceHolder || match.awayTeam.isPlaceHolder) continue;

    fixtures.push(toSeedFixture(source, match, stage));
  }

  const drawnStages = new Set(fixtures.map((f) => f.stage));
  const stages: SeedStage[] = rawRounds
    .map((round): SeedStage | null => {
      const stage = STAGE_BY_UEFA_ROUND[round.metaData.name];
      if (!stage || !IMPORTED_STAGES.has(stage)) return null;
      return {
        stage,
        externalRoundId: round.id,
        name: round.metaData.name,
        order: round.orderInCompetition,
        dateFrom: round.dateFrom.slice(0, 10),
        dateTo: round.dateTo.slice(0, 10),
        // The league phase is a group, not a two-legged round.
        legs:
          stage === "league_phase" || round.modeDetail === "KNOCK_OUT_ONE_LEG" ? 1 : 2,
        teamCount: round.teamCount,
        drawn: drawnStages.has(stage),
      };
    })
    .filter((s): s is SeedStage => s !== null)
    .sort((a, b) => a.order - b.order);

  fixtures.sort(
    (a, b) =>
      (a.kickoffTime ?? a.date ?? "9999").localeCompare(
        b.kickoffTime ?? b.date ?? "9999",
      ) || a.homeTeam.localeCompare(b.homeTeam),
  );

  const problems = [...validateLeaguePhase(fixtures), ...validateKnockout(fixtures)];
  if (problems.length) {
    throw new Error(`Refusing to write an invalid season:\n  ${problems.join("\n  ")}`);
  }

  const seed: UefaSeed = {
    season: source.seasonLabel,
    competition: source.competitionSlug,
    source: source.sourceUrl,
    importedAt: new Date().toISOString(),
    stages,
    fixtures,
  };

  await writeFile(outFile, `${JSON.stringify(seed, null, 2)}\n`);

  const phase = fixtures.filter((f) => f.stage === "league_phase");
  console.log(
    `\n✓ ${phase.length} league-phase fixtures, ` +
      `${new Set(phase.flatMap((f) => [f.homeTeam, f.awayTeam])).size} clubs, ` +
      `${new Set(phase.map((f) => f.matchday)).size} matchdays`,
  );
  console.log(`  ${fixtures.filter((f) => f.finished).length} completed`);
  console.log(`  ${fixtures.filter((f) => f.stadium).length}/${fixtures.length} with a venue`);
  console.log(
    `  ${fixtures.filter((f) => f.kickoffTime).length}/${fixtures.length} with a kickoff time`,
  );
  console.log(`  written to ${path.relative(process.cwd(), outFile)}`);

  console.log("\nStage calendar:");
  for (const stage of stages) {
    const count = fixtures.filter((f) => f.stage === stage.stage).length;
    console.log(
      `  ${stage.name.padEnd(26)} ${stage.dateFrom} → ${stage.dateTo}  ` +
        (stage.drawn ? `${count} fixtures` : "not drawn — calendar only"),
    );
  }

  if (skipped.size) {
    console.log(
      `\nNot imported (outside the league phase and knockout bracket): ` +
        [...skipped].map(([s, n]) => `${n} ${s}`).join(", "),
    );
  }
}
