/**
 * Builds the LALIGA EA SPORTS 2026/27 season seed from the league's own
 * published matchweek pages.
 *
 *   npm run import:laliga
 *
 * Source: https://www.laliga.com/en-GB/laliga-easports/results/2026-27/gameweek-{1..38}
 *
 * Like the Premier League importer this is a one-off seed, not a
 * synchronization loop — ongoing updates go through the approved football API
 * (scripts/sync-fixtures.ts). See docs/la-liga-import.md.
 *
 * Kick-off times: LALIGA schedules roughly two matchweeks ahead and marks
 * every unscheduled fixture with a midnight placeholder on the matchweek's
 * nominal date. Those fixtures are stored with **no date and no kickoff** —
 * the nominal date is a week marker, not a matchday, and presenting it as one
 * would be inventing a date. The nominal date is kept separately, for
 * ordering only.
 *
 * The importer refuses to write anything that fails validation.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SEASON = "2026/27";
const COMPETITION = "la-liga";
const MATCHWEEKS = 38;
const MATCHES_PER_MATCHWEEK = 10;
const EXPECTED_FIXTURES = MATCHWEEKS * MATCHES_PER_MATCHWEEK;
const EXPECTED_CLUBS = 20;

const OUT_FILE = path.join(
  process.cwd(),
  "src",
  "lib",
  "football",
  "data",
  "la-liga-2026-27.json",
);

const sourceUrl = (week: number) =>
  `https://www.laliga.com/en-GB/laliga-easports/results/2026-27/gameweek-${week}`;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36";

/** A date with no time component is LALIGA's "not scheduled yet" marker. */
const PLACEHOLDER_TIME = "T00:00:00+00:00";

interface LaLigaTeam {
  id: number;
  slug: string;
  name: string;
  nickname: string | null;
  shield?: { url?: string } | null;
}

interface LaLigaMatch {
  id: number;
  date: string;
  status: string;
  home_team: LaLigaTeam;
  away_team: LaLigaTeam;
  venue?: { name?: string } | null;
}

export interface SeededFixture {
  externalFixtureId: string;
  season: string;
  matchweek: number;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date, or null when only the matchweek is fixed. */
  date: string | null;
  /** ISO datetime in UTC, or null when the slot is not scheduled yet. */
  kickoffTime: string | null;
  /** The matchweek's nominal date. Ordering only — never shown as a matchday. */
  nominalDate: string;
  venue: string | null;
  finished: boolean;
}

/** Club display names, keyed by LALIGA's own slug. */
export const LA_LIGA_CLUB_NAMES: Record<string, string> = {
  "d-alaves": "Deportivo Alavés",
  "athletic-club": "Athletic Club",
  "atletico-de-madrid": "Atlético de Madrid",
  "fc-barcelona": "FC Barcelona",
  "real-betis": "Real Betis",
  "rc-celta": "RC Celta de Vigo",
  "rc-deportivo": "RC Deportivo de La Coruña",
  "elche-c-f": "Elche CF",
  "rcd-espanyol": "RCD Espanyol",
  "getafe-cf": "Getafe CF",
  "levante-ud": "Levante UD",
  "malaga-cf": "Málaga CF",
  "c-a-osasuna": "CA Osasuna",
  "rayo-vallecano": "Rayo Vallecano",
  "r-racing-club": "Real Racing Club de Santander",
  "real-madrid": "Real Madrid",
  "real-sociedad": "Real Sociedad",
  "sevilla-fc": "Sevilla FC",
  "valencia-cf": "Valencia CF",
  "villarreal-cf": "Villarreal CF",
};

function nameFor(team: LaLigaTeam): string {
  const known = LA_LIGA_CLUB_NAMES[team.slug];
  if (!known) {
    throw new Error(
      `Unknown LALIGA club slug "${team.slug}" (${team.name}). ` +
        `Add it to LA_LIGA_CLUB_NAMES before importing.`,
    );
  }
  return known;
}

async function fetchMatchweek(week: number): Promise<LaLigaMatch[]> {
  const res = await fetch(sourceUrl(week), { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Matchweek ${week}: source returned ${res.status}`);

  const html = await res.text();
  const match = /<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/.exec(
    html,
  );
  if (!match) throw new Error(`Matchweek ${week}: could not find embedded fixture data`);

  const data = JSON.parse(match[1]) as {
    props: { pageProps: { gameweek?: { week?: number }; matches?: LaLigaMatch[] } };
  };
  const props = data.props.pageProps;

  if (props.gameweek?.week !== week) {
    throw new Error(
      `Matchweek ${week}: page reported matchweek ${props.gameweek?.week}`,
    );
  }
  if (!props.matches?.length) throw new Error(`Matchweek ${week}: no fixtures`);

  return props.matches;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toSeeded(week: number, match: LaLigaMatch): SeededFixture {
  const homeTeam = nameFor(match.home_team);
  const awayTeam = nameFor(match.away_team);
  const scheduled = !match.date.endsWith(PLACEHOLDER_TIME);

  return {
    // Stable across re-imports and reschedules: the pairing within the season,
    // never the date.
    externalFixtureId: `laliga-2026-27-${slug(homeTeam)}-v-${slug(awayTeam)}`,
    season: SEASON,
    matchweek: week,
    competition: COMPETITION,
    homeTeam,
    awayTeam,
    date: scheduled ? match.date.slice(0, 10) : null,
    kickoffTime: scheduled ? new Date(match.date).toISOString() : null,
    nominalDate: match.date.slice(0, 10),
    venue: match.venue?.name?.trim() || null,
    finished: match.status === "FullTime",
  };
}

/** Refuses to emit a season that is not structurally a complete league. */
function validate(fixtures: SeededFixture[]): void {
  const problems: string[] = [];

  if (fixtures.length !== EXPECTED_FIXTURES) {
    problems.push(`expected ${EXPECTED_FIXTURES} fixtures, got ${fixtures.length}`);
  }

  const clubs = [...new Set(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))];
  if (clubs.length !== EXPECTED_CLUBS) {
    problems.push(`expected ${EXPECTED_CLUBS} clubs, got ${clubs.length}`);
  }

  for (const club of clubs) {
    const home = fixtures.filter((f) => f.homeTeam === club).length;
    const away = fixtures.filter((f) => f.awayTeam === club).length;
    if (home !== 19 || away !== 19) {
      problems.push(`${club}: ${home} home / ${away} away (expected 19 / 19)`);
    }
  }

  const pairings = new Set<string>();
  for (const f of fixtures) {
    const key = `${f.homeTeam}|${f.awayTeam}`;
    if (pairings.has(key)) problems.push(`duplicate pairing: ${f.homeTeam} v ${f.awayTeam}`);
    pairings.add(key);
    if (f.homeTeam === f.awayTeam) problems.push(`self fixture: ${f.homeTeam}`);
  }

  const ids = new Set(fixtures.map((f) => f.externalFixtureId));
  if (ids.size !== fixtures.length) problems.push("duplicate external fixture ids");

  for (let week = 1; week <= MATCHWEEKS; week++) {
    const inWeek = fixtures.filter((f) => f.matchweek === week);
    const teams = new Set(inWeek.flatMap((f) => [f.homeTeam, f.awayTeam]));
    if (inWeek.length !== MATCHES_PER_MATCHWEEK || teams.size !== EXPECTED_CLUBS) {
      problems.push(
        `matchweek ${week}: ${inWeek.length} fixtures, ${teams.size} distinct clubs`,
      );
    }
  }

  // A finished fixture must have an actual kickoff — it was played.
  const finishedWithoutTime = fixtures.filter((f) => f.finished && !f.kickoffTime);
  if (finishedWithoutTime.length) {
    problems.push(`${finishedWithoutTime.length} completed fixture(s) have no kickoff time`);
  }

  if (problems.length) {
    throw new Error(`Refusing to write an invalid season:\n  ${problems.join("\n  ")}`);
  }
}

async function main() {
  const fixtures: SeededFixture[] = [];

  for (let week = 1; week <= MATCHWEEKS; week++) {
    const matches = await fetchMatchweek(week);
    for (const match of matches) fixtures.push(toSeeded(week, match));
    process.stdout.write(`\rFetched matchweek ${week}/${MATCHWEEKS}`);
    // Be a considerate client of someone else's site.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  process.stdout.write("\n");

  fixtures.sort(
    (a, b) =>
      a.matchweek - b.matchweek ||
      (a.kickoffTime ?? a.nominalDate).localeCompare(b.kickoffTime ?? b.nominalDate) ||
      a.homeTeam.localeCompare(b.homeTeam),
  );

  validate(fixtures);

  const scheduled = fixtures.filter((f) => f.kickoffTime).length;
  const finished = fixtures.filter((f) => f.finished).length;
  const withVenue = fixtures.filter((f) => f.venue).length;

  await writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        season: SEASON,
        competition: COMPETITION,
        source: sourceUrl(1).replace(/gameweek-1$/, "gameweek-{1..38}"),
        importedAt: new Date().toISOString(),
        fixtures,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`\n✓ ${fixtures.length} fixtures, ${EXPECTED_CLUBS} clubs, ${MATCHWEEKS} matchweeks`);
  console.log(`  ${scheduled} with a confirmed kickoff, ${fixtures.length - scheduled} still to be scheduled`);
  console.log(`  ${finished} completed, ${withVenue}/${fixtures.length} with a venue`);
  console.log(`  written to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
