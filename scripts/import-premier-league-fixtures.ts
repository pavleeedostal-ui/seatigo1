/**
 * Builds the Premier League 2026/27 season seed from the league's own
 * published fixture list.
 *
 *   npm run import:pl
 *
 * Source: https://www.premierleague.com/en/news/4675097/all-380-fixtures-for-202627-premier-league-season
 *
 * This is a one-off seed import, not a synchronization loop — ongoing updates
 * go through the approved football API (see scripts/sync-fixtures.ts), which
 * upserts on the stable internal fixture id. See docs/premier-league-import.md.
 *
 * The importer refuses to write anything that fails validation, so a bad
 * parse can never silently become fixture data.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL =
  "https://www.premierleague.com/en/news/4675097/all-380-fixtures-for-202627-premier-league-season";
const OUT_FILE = path.join(
  process.cwd(),
  "src",
  "lib",
  "football",
  "data",
  "premier-league-2026-27.json",
);

const SEASON = "2026/27";
const COMPETITION = "premier-league";
const EXPECTED_FIXTURES = 380;
const EXPECTED_CLUBS = 20;
const MATCHES_PER_MATCHWEEK = 10;

/**
 * The article states: "The kick-off times of weekend and Bank Holiday matches
 * are 15:00 UK time, while for midweek matches it is 20:00 unless otherwise
 * stated." Fixtures that fall back on this rule are marked provisional so the
 * UI can say so rather than presenting a broadcast-confirmed time.
 */
const DEFAULT_WEEKEND_KICKOFF = "15:00";
const DEFAULT_MIDWEEK_KICKOFF = "20:00";

/** Every name variant the article uses, mapped to one canonical club name. */
const CANONICAL_CLUB: Record<string, string> = {
  "AFC Bournemouth": "AFC Bournemouth",
  Arsenal: "Arsenal",
  "Aston Villa": "Aston Villa",
  Brentford: "Brentford",
  Brighton: "Brighton & Hove Albion",
  "Brighton & Hove Albion": "Brighton & Hove Albion",
  Chelsea: "Chelsea",
  Coventry: "Coventry City",
  "Coventry City": "Coventry City",
  "Crystal Palace": "Crystal Palace",
  Everton: "Everton",
  Fulham: "Fulham",
  Hull: "Hull City",
  "Hull City": "Hull City",
  Ipswich: "Ipswich Town",
  "Ipswich Town": "Ipswich Town",
  Leeds: "Leeds United",
  "Leeds United": "Leeds United",
  Liverpool: "Liverpool",
  "Man City": "Manchester City",
  "Manchester City": "Manchester City",
  "Man Utd": "Manchester United",
  "Manchester United": "Manchester United",
  Newcastle: "Newcastle United",
  "Newcastle United": "Newcastle United",
  "Nott'm Forest": "Nottingham Forest",
  "Nottingham Forest": "Nottingham Forest",
  Spurs: "Tottenham Hotspur",
  "Tottenham Hotspur": "Tottenham Hotspur",
  Sunderland: "Sunderland",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DATE_RE =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})\s+([A-Z][a-z]+)(?:\s+(\d{4}))?$/;
// Optional kick-off time, an optional GMT/BST marker, "Home v Away", and an
// optional "(Broadcaster)" with an optional footnote asterisk.
const FIXTURE_RE =
  /^(?:(\d{2}:\d{2})\s+)?(?:GMT\s+|BST\s+)?(.+?)\s+v\s+(.+?)(?:\s*\(([^)]*)\)\*?)?\*?$/;

interface ParsedFixture {
  date: string;
  weekday: string;
  time: string | null;
  home: string;
  away: string;
  broadcaster: string | null;
}

export interface SeededFixture {
  externalFixtureId: string;
  season: string;
  matchweek: number;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date in Europe/London terms, as the league publishes it. */
  date: string;
  /** ISO datetime in UTC. */
  kickoffTime: string;
  /** True when the time came from the article's stated default, not a listing. */
  kickoffProvisional: boolean;
  broadcaster: string | null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"');
}

/** Converts a Europe/London wall-clock time to a UTC instant (handles BST). */
function londonToUtc(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Start from the naive UTC reading, then subtract London's offset at that
  // instant. One correction pass is enough away from the DST boundary hour.
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const offsetMinutes = londonOffsetMinutes(new Date(naive));
  return new Date(naive - offsetMinutes * 60_000).toISOString();
}

function londonOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function parseArticle(html: string): ParsedFixture[] {
  const all = stripTags(html)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const start = all.findIndex((l) => l.startsWith("All 380 fixtures"));
  if (start === -1) throw new Error("Could not find the fixture list in the source page.");
  const endOffset = all.slice(start).findIndex((l) => l === "Related Content");
  const lines = endOffset === -1 ? all.slice(start) : all.slice(start, start + endOffset);

  const fixtures: ParsedFixture[] = [];
  let current: { y: number; m: number; d: number; weekday: string } | null = null;
  let year = 2026;
  let lastMonth = 8;

  for (const line of lines) {
    const dateMatch = DATE_RE.exec(line);
    if (dateMatch) {
      const month = MONTHS.indexOf(dateMatch[3]) + 1;
      if (dateMatch[4]) year = Number(dateMatch[4]);
      else if (month < lastMonth) year += 1; // December -> January rollover
      lastMonth = month;
      current = { y: year, m: month, d: Number(dateMatch[2]), weekday: dateMatch[1] };
      continue;
    }

    if (!current || !line.includes(" v ")) continue;
    const m = FIXTURE_RE.exec(line);
    if (!m) throw new Error(`Unparsed fixture line: ${JSON.stringify(line)}`);

    const home = CANONICAL_CLUB[m[2].trim()];
    const away = CANONICAL_CLUB[m[3].trim()];
    if (!home || !away) {
      throw new Error(`Unknown club name in: ${JSON.stringify(line)}`);
    }

    fixtures.push({
      date: `${current.y}-${String(current.m).padStart(2, "0")}-${String(current.d).padStart(2, "0")}`,
      weekday: current.weekday,
      time: m[1] ?? null,
      home,
      away,
      broadcaster: m[4] ?? null,
    });
  }

  return fixtures;
}

/**
 * The article is amended in place when a fixture moves, which can leave the
 * same pairing listed on both its original and its new date. The listing that
 * carries a confirmed kick-off time is the broadcast selection, so it wins.
 */
function dedupeAmendments(fixtures: ParsedFixture[]): ParsedFixture[] {
  const best = new Map<string, ParsedFixture>();
  for (const fixture of fixtures) {
    const key = `${fixture.home}|${fixture.away}`;
    const existing = best.get(key);
    if (!existing || (fixture.time && !existing.time)) best.set(key, fixture);
  }
  return [...best.values()].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? "99:99").localeCompare(b.time ?? "99:99") ||
      a.home.localeCompare(b.home),
  );
}

function toSeeded(fixtures: ParsedFixture[]): SeededFixture[] {
  return fixtures.map((fixture, index) => {
    const isWeekend = fixture.weekday === "Saturday" || fixture.weekday === "Sunday";
    const provisional = !fixture.time;
    const time =
      fixture.time ?? (isWeekend ? DEFAULT_WEEKEND_KICKOFF : DEFAULT_MIDWEEK_KICKOFF);

    return {
      // Stable across re-imports and kickoff changes: it identifies the
      // pairing within the season, never the date.
      externalFixtureId: `pl-2026-27-${slug(fixture.home)}-v-${slug(fixture.away)}`,
      season: SEASON,
      matchweek: Math.floor(index / MATCHES_PER_MATCHWEEK) + 1,
      competition: COMPETITION,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      date: fixture.date,
      kickoffTime: londonToUtc(fixture.date, time),
      kickoffProvisional: provisional,
      broadcaster: fixture.broadcaster,
    };
  });
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  }

  const ids = new Set(fixtures.map((f) => f.externalFixtureId));
  if (ids.size !== fixtures.length) problems.push("duplicate external fixture ids");

  for (let week = 1; week <= EXPECTED_FIXTURES / MATCHES_PER_MATCHWEEK; week++) {
    const inWeek = fixtures.filter((f) => f.matchweek === week);
    const teams = new Set(inWeek.flatMap((f) => [f.homeTeam, f.awayTeam]));
    if (inWeek.length !== MATCHES_PER_MATCHWEEK || teams.size !== EXPECTED_CLUBS) {
      problems.push(
        `matchweek ${week}: ${inWeek.length} fixtures, ${teams.size} distinct clubs`,
      );
    }
  }

  if (problems.length) {
    throw new Error(`Refusing to write an invalid season:\n  ${problems.join("\n  ")}`);
  }
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Source returned ${res.status}`);

  const parsed = parseArticle(await res.text());
  console.log(`Parsed ${parsed.length} fixture listings`);

  const deduped = dedupeAmendments(parsed);
  if (deduped.length !== parsed.length) {
    console.log(
      `Resolved ${parsed.length - deduped.length} in-place amendment(s) ` +
        `(kept the broadcast-confirmed listing)`,
    );
  }

  const fixtures = toSeeded(deduped);
  validate(fixtures);

  const confirmed = fixtures.filter((f) => !f.kickoffProvisional).length;
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

  console.log(`\n✓ ${fixtures.length} fixtures, ${EXPECTED_CLUBS} clubs, 38 matchweeks`);
  console.log(`  ${confirmed} confirmed kick-off times, ${fixtures.length - confirmed} provisional`);
  console.log(`  written to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
