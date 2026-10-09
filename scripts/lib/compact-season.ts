/**
 * Shared importer for seasons taken from a compact checked-in extract.
 *
 * Ligue 1 and the Bundesliga both publish their calendars only through a
 * client-rendered widget — neither can be fetched server-side, and neither
 * fires a data request when you step between matchdays. Their schedules are
 * therefore extracted from the rendered page into a small CSV under
 * `src/lib/football/data/`, and this module turns that CSV into a season seed
 * with the same shape and the same validation contract as the fetch-based
 * importers. See docs/ligue-1-bundesliga-import.md.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

export interface SeededFixture {
  externalFixtureId: string;
  season: string;
  matchweek: number;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date, or null when the matchweek has no fixed day yet. */
  date: string | null;
  /** ISO datetime in UTC, or null when the slot is not scheduled yet. */
  kickoffTime: string | null;
  /** The matchweek's published day, when it has one. Ordering only. */
  nominalDate: string | null;
  finished: boolean;
}

export interface CompactSeasonConfig {
  competition: string;
  season: string;
  /** Season label used in external fixture ids, e.g. "2026-27". */
  idSeason: string;
  matchweeks: number;
  clubsPerLeague: number;
  /** IANA zone the published kickoff times are expressed in. */
  timeZone: string;
  sourceUrl: string;
  inFile: string;
  outFile: string;
  /** Single-character code -> official club name. */
  clubs: Record<string, string>;
  /**
   * Column layout of the extract. Both leagues share the first five columns;
   * Ligue 1 adds the provider's own fixture id and a played flag.
   */
  hasExternalId?: boolean;
  /** Prefix restored onto the shortened provider id. */
  externalIdPrefix?: string;
}

/** Season runs Aug–May, so months Jan–Jul belong to the following year. */
function seasonYear(month: number, startYear: number): number {
  return month >= 8 ? startYear : startYear + 1;
}

function offsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** Converts a local wall-clock time in `zone` to a UTC instant. */
function toUtc(date: string, hhmm: string, zone: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const hh = Number(hhmm.slice(0, 2));
  const mm = Number(hhmm.slice(2, 4));
  const naive = Date.UTC(y, mo - 1, d, hh, mm);
  return new Date(naive - offsetMinutes(zone, new Date(naive)) * 60_000).toISOString();
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseCompactSeason(
  csv: string,
  config: CompactSeasonConfig,
  startYear: number,
): SeededFixture[] {
  const fixtures: SeededFixture[] = [];

  for (const [index, raw] of csv.split("\n").entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const cols = line.split(",");
    const [weekRaw, dayRaw, timeRaw, homeCode, awayCode] = cols;

    const homeTeam = config.clubs[homeCode];
    const awayTeam = config.clubs[awayCode];
    if (!homeTeam || !awayTeam) {
      throw new Error(
        `Line ${index + 1}: unknown club code "${!homeTeam ? homeCode : awayCode}"`,
      );
    }

    // "9Oct" -> 2026-10-09. A blank day means the matchweek has no published
    // date at all, which is a real state for both of these leagues.
    let nominalDate: string | null = null;
    if (dayRaw) {
      const m = /^(\d{1,2})([A-Za-z]{3})$/.exec(dayRaw);
      if (!m) throw new Error(`Line ${index + 1}: unparsed day "${dayRaw}"`);
      const month = MONTHS[m[2]];
      if (!month) throw new Error(`Line ${index + 1}: unknown month "${m[2]}"`);
      nominalDate = `${seasonYear(month, startYear)}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }

    const scheduled = Boolean(timeRaw && nominalDate);
    const externalId =
      config.hasExternalId && cols[5]
        ? `${config.externalIdPrefix ?? ""}${cols[5]}`
        : `${config.competition}-${config.idSeason}-${slug(homeTeam)}-v-${slug(awayTeam)}`;

    // A fixture whose published day has passed has been played. Neither league
    // publishes the kickoff time of a completed match, so those keep a date
    // and no time rather than claiming one.
    const playedFlag = config.hasExternalId ? cols[6] === "1" : undefined;
    const finished =
      playedFlag ??
      Boolean(nominalDate && new Date(`${nominalDate}T23:59:59Z`).getTime() < Date.now());

    // A future fixture with no kickoff carries only its matchweek's marker
    // date — all its week's fixtures share it — so it is not a matchday and
    // is not presented as one. A completed fixture's date is real.
    const hasRealDate = scheduled || finished;

    fixtures.push({
      externalFixtureId: externalId,
      season: config.season,
      matchweek: Number(weekRaw),
      competition: config.competition,
      homeTeam,
      awayTeam,
      date: hasRealDate ? nominalDate : null,
      kickoffTime: scheduled ? toUtc(nominalDate!, timeRaw, config.timeZone) : null,
      nominalDate,
      finished,
    });
  }

  return fixtures;
}

/** Refuses to emit a season that is not structurally a complete league. */
export function validateCompactSeason(
  fixtures: SeededFixture[],
  config: CompactSeasonConfig,
): string[] {
  const problems: string[] = [];
  const expected = config.matchweeks * (config.clubsPerLeague / 2);
  const perClub = config.matchweeks;
  const perSide = perClub / 2;

  if (fixtures.length !== expected) {
    problems.push(`expected ${expected} fixtures, got ${fixtures.length}`);
  }

  const clubs = [...new Set(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))];
  if (clubs.length !== config.clubsPerLeague) {
    problems.push(`expected ${config.clubsPerLeague} clubs, got ${clubs.length}`);
  }

  for (const club of clubs) {
    const total = fixtures.filter(
      (f) => f.homeTeam === club || f.awayTeam === club,
    ).length;
    if (total !== perClub) problems.push(`${club}: ${total} fixtures (expected ${perClub})`);
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

  for (let week = 1; week <= config.matchweeks; week++) {
    const inWeek = fixtures.filter((f) => f.matchweek === week);
    const teams = new Set(inWeek.flatMap((f) => [f.homeTeam, f.awayTeam]));
    if (
      inWeek.length !== config.clubsPerLeague / 2 ||
      teams.size !== config.clubsPerLeague
    ) {
      problems.push(
        `matchweek ${week}: ${inWeek.length} fixtures, ${teams.size} distinct clubs`,
      );
    }
  }

  // Reported separately from the hard failures above: a source may publish a
  // lopsided calendar, and that is its data, not our parse.
  for (const club of clubs) {
    const home = fixtures.filter((f) => f.homeTeam === club).length;
    const away = fixtures.filter((f) => f.awayTeam === club).length;
    if (home !== perSide || away !== perSide) {
      problems.push(
        `SOURCE: ${club} has ${home} home / ${away} away (expected ${perSide} / ${perSide})`,
      );
    }
  }

  return problems;
}

export async function runCompactImport(
  config: CompactSeasonConfig,
  startYear: number,
  /** Home/away imbalances the source is known to publish; reported, not fatal. */
  knownSourceIssues: string[] = [],
): Promise<void> {
  const csv = await readFile(config.inFile, "utf8");
  const fixtures = parseCompactSeason(csv, config, startYear);

  fixtures.sort(
    (a, b) =>
      a.matchweek - b.matchweek ||
      (a.kickoffTime ?? a.nominalDate ?? "").localeCompare(
        b.kickoffTime ?? b.nominalDate ?? "",
      ) || a.homeTeam.localeCompare(b.homeTeam),
  );

  const problems = validateCompactSeason(fixtures, config);
  const fatal = problems.filter((p) => !knownSourceIssues.includes(p));
  if (fatal.length) {
    throw new Error(`Refusing to write an invalid season:\n  ${fatal.join("\n  ")}`);
  }

  await writeFile(
    config.outFile,
    `${JSON.stringify(
      {
        season: config.season,
        competition: config.competition,
        source: config.sourceUrl,
        importedAt: new Date().toISOString(),
        fixtures,
      },
      null,
      2,
    )}\n`,
  );

  const scheduled = fixtures.filter((f) => f.kickoffTime).length;
  const dated = fixtures.filter((f) => f.date).length;
  console.log(
    `✓ ${fixtures.length} fixtures, ${config.clubsPerLeague} clubs, ${config.matchweeks} matchweeks`,
  );
  console.log(
    `  ${scheduled} with a confirmed kickoff, ${dated - scheduled} dated without a time, ` +
      `${fixtures.length - dated} with no published date`,
  );
  console.log(`  ${fixtures.filter((f) => f.finished).length} completed`);
  console.log(`  written to ${path.relative(process.cwd(), config.outFile)}`);

  for (const issue of problems.filter((p) => knownSourceIssues.includes(p))) {
    console.log(`\n⚠ known source discrepancy: ${issue}`);
  }
}
