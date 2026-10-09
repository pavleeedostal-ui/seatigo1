/**
 * Builds the Serie A Enilive 2026/27 season seed.
 *
 *   npm run import:seriea
 *
 * Source: https://en.legaseriea.it/serie-a/fixtures-results
 *
 * Unlike the Premier League and La Liga importers this one reads a checked-in
 * extract (`data/serie-a-2026-27.source.tsv`) rather than fetching, because
 * Lega Serie A's schedule cannot be fetched server-side: the page
 * server-renders only the current matchday, all 38 live in the fixtures
 * widget's client state, and stepping between them fires no network request.
 * The extract was taken from that widget and its transfer verified by
 * checksum. docs/serie-a-import.md records the exact extraction recipe so it
 * can be reproduced or replaced by a licensed feed.
 *
 * Columns: matchweek, date, kickoff (Europe/Rome, blank when unscheduled),
 * home, away, completed(0|1).
 *
 * The importer refuses to write anything that fails validation.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SEASON = "2026/27";
const COMPETITION = "serie-a";
const MATCHWEEKS = 38;
const MATCHES_PER_MATCHWEEK = 10;
const EXPECTED_FIXTURES = MATCHWEEKS * MATCHES_PER_MATCHWEEK;
const EXPECTED_CLUBS = 20;

const SOURCE_URL = "https://en.legaseriea.it/serie-a/fixtures-results";
const DATA_DIR = path.join(process.cwd(), "src", "lib", "football", "data");
const IN_FILE = path.join(DATA_DIR, "serie-a-2026-27.source.tsv");
const OUT_FILE = path.join(DATA_DIR, "serie-a-2026-27.json");

/**
 * Lega Serie A's short names, mapped to the club's full name. Every variant
 * the source emits must appear here or the import fails loudly.
 */
const CANONICAL_CLUB: Record<string, string> = {
  Atalanta: "Atalanta BC",
  Bologna: "Bologna FC",
  Cagliari: "Cagliari Calcio",
  Como: "Como 1907",
  Fiorentina: "ACF Fiorentina",
  Frosinone: "Frosinone Calcio",
  Genoa: "Genoa CFC",
  Inter: "Inter Milan",
  Juventus: "Juventus FC",
  Lazio: "SS Lazio",
  Lecce: "US Lecce",
  Milan: "AC Milan",
  Monza: "AC Monza",
  Napoli: "SSC Napoli",
  Parma: "Parma Calcio",
  Roma: "AS Roma",
  Sassuolo: "US Sassuolo",
  Torino: "Torino FC",
  Udinese: "Udinese Calcio",
  Venezia: "Venezia FC",
};

/** "Sat, 22 Aug 2026" / "Fri, 4 Sept 2026" -> "2026-08-22". */
const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, June: 6,
  Jul: 7, July: 7, Aug: 8, Sep: 9, Sept: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseDate(value: string): string {
  const m = /^[A-Za-z]{3},\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(value.trim());
  if (!m) throw new Error(`Unparsed date: ${JSON.stringify(value)}`);
  const month = MONTHS[m[2]];
  if (!month) throw new Error(`Unknown month in: ${JSON.stringify(value)}`);
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Converts a Europe/Rome wall-clock time to a UTC instant (handles CEST). */
function romeToUtc(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, hh, mm);
  return new Date(naive - romeOffsetMinutes(new Date(naive)) * 60_000).toISOString();
}

function romeOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  finished: boolean;
}

function parse(tsv: string): SeededFixture[] {
  const fixtures: SeededFixture[] = [];

  for (const [index, raw] of tsv.split("\n").entries()) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) continue;

    const cols = line.split("\t");
    if (cols.length !== 6) {
      throw new Error(`Line ${index + 1}: expected 6 columns, got ${cols.length}`);
    }

    const [weekRaw, dateRaw, timeRaw, homeRaw, awayRaw, finishedRaw] = cols;
    const homeTeam = CANONICAL_CLUB[homeRaw.trim()];
    const awayTeam = CANONICAL_CLUB[awayRaw.trim()];
    if (!homeTeam || !awayTeam) {
      throw new Error(
        `Line ${index + 1}: unknown club "${!homeTeam ? homeRaw : awayRaw}". ` +
          `Add it to CANONICAL_CLUB before importing.`,
      );
    }

    const nominalDate = parseDate(dateRaw);
    // Lega Serie A leaves the kickoff blank until the slot is fixed, and then
    // all ten fixtures in the week share one nominal date — a week marker, not
    // a matchday. Storing that date would be inventing one.
    const scheduled = timeRaw.trim().length > 0;

    fixtures.push({
      // Stable across re-imports and reschedules: the pairing within the
      // season, never the date.
      externalFixtureId: `seriea-2026-27-${slug(homeTeam)}-v-${slug(awayTeam)}`,
      season: SEASON,
      matchweek: Number(weekRaw),
      competition: COMPETITION,
      homeTeam,
      awayTeam,
      date: scheduled ? nominalDate : null,
      kickoffTime: scheduled ? romeToUtc(nominalDate, timeRaw.trim()) : null,
      nominalDate,
      finished: finishedRaw.trim() === "1",
    });
  }

  return fixtures;
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
  const fixtures = parse(await readFile(IN_FILE, "utf8"));

  fixtures.sort(
    (a, b) =>
      a.matchweek - b.matchweek ||
      (a.kickoffTime ?? a.nominalDate).localeCompare(b.kickoffTime ?? b.nominalDate) ||
      a.homeTeam.localeCompare(b.homeTeam),
  );

  validate(fixtures);

  const scheduled = fixtures.filter((f) => f.kickoffTime).length;
  const finished = fixtures.filter((f) => f.finished).length;

  await writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        season: SEASON,
        competition: COMPETITION,
        source: SOURCE_URL,
        importedAt: new Date().toISOString(),
        fixtures,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`✓ ${fixtures.length} fixtures, ${EXPECTED_CLUBS} clubs, ${MATCHWEEKS} matchweeks`);
  console.log(
    `  ${scheduled} with a confirmed kickoff, ${fixtures.length - scheduled} still to be scheduled`,
  );
  console.log(`  ${finished} completed`);
  console.log(`  written to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
