/**
 * Refreshes an imported season against the approved football API.
 *
 *   npm run sync:fixtures            # report only
 *   npm run sync:fixtures -- --write # apply changes
 *
 * Premier League kickoff times move throughout the season as broadcasters
 * pick their slots. This reconciles the stored season with the provider and
 * **upserts on the stable internal fixture id**, which is derived from the
 * pairing and the season — never from the date — so a fixture that moves
 * keeps its id, its URL and any offers already mapped to it.
 *
 * Requires FOOTBALL_DATA_API_KEY (see .env.example). Without it the script
 * reports that it cannot sync rather than touching the data.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CLUB_CRESTS } from "@/lib/football/club-logos";

const DATA_FILE = path.join(
  process.cwd(),
  "src",
  "lib",
  "football",
  "data",
  "premier-league-2026-27.json",
);
const COMPETITION_CODE = "PL";
/** football-data.org labels a season by its starting year. */
const SEASON_START_YEAR = 2026;

interface StoredFixture {
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

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
}

const clubNameByFootballDataId = new Map<number, string>();
for (const crest of CLUB_CRESTS) {
  if (crest.footballDataId != null) clubNameByFootballDataId.set(crest.footballDataId, crest.slug);
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Same rule as the importer: identity is the pairing, not the date. */
function fixtureIdFor(homeSlug: string, awaySlug: string): string {
  return `pl-2026-27-${homeSlug}-v-${awaySlug}`;
}

async function main() {
  const write = process.argv.includes("--write");
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.error(
      "FOOTBALL_DATA_API_KEY is not set, so the season cannot be synchronized.\n" +
        "The stored season stays untouched. See .env.example.",
    );
    process.exit(1);
  }

  const stored = JSON.parse(await readFile(DATA_FILE, "utf8")) as {
    season: string;
    fixtures: StoredFixture[];
    [key: string]: unknown;
  };

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/matches?season=${SEASON_START_YEAR}`,
    { headers: { "X-Auth-Token": apiKey } },
  );
  if (!res.ok) throw new Error(`Provider returned ${res.status}`);
  const { matches } = (await res.json()) as { matches: FdMatch[] };

  const byId = new Map(stored.fixtures.map((f) => [f.externalFixtureId, f]));
  const changes: string[] = [];
  const added: StoredFixture[] = [];
  let unchanged = 0;

  for (const match of matches) {
    const homeSlug =
      clubNameByFootballDataId.get(match.homeTeam.id) ?? slug(match.homeTeam.name);
    const awaySlug =
      clubNameByFootballDataId.get(match.awayTeam.id) ?? slug(match.awayTeam.name);
    const id = fixtureIdFor(homeSlug, awaySlug);
    const existing = byId.get(id);

    if (!existing) {
      // A pairing the stored season does not have. Reported, never silently
      // appended, because it usually means the club mapping is wrong.
      added.push({
        externalFixtureId: id,
        season: stored.season,
        matchweek: match.matchday ?? 0,
        competition: "premier-league",
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        date: match.utcDate.slice(0, 10),
        kickoffTime: match.utcDate,
        kickoffProvisional: false,
        broadcaster: null,
      });
      continue;
    }

    // Upsert in place: same id, new schedule.
    if (existing.kickoffTime !== match.utcDate) {
      changes.push(
        `${existing.homeTeam} v ${existing.awayTeam}: ${existing.kickoffTime} -> ${match.utcDate}`,
      );
      existing.kickoffTime = match.utcDate;
      existing.date = match.utcDate.slice(0, 10);
      // A provider time is a confirmed time.
      existing.kickoffProvisional = false;
    } else {
      unchanged += 1;
    }

    if (match.matchday && existing.matchweek !== match.matchday) {
      changes.push(
        `${existing.homeTeam} v ${existing.awayTeam}: matchweek ${existing.matchweek} -> ${match.matchday}`,
      );
      existing.matchweek = match.matchday;
    }
  }

  console.log(`Provider returned ${matches.length} fixtures`);
  console.log(`${unchanged} unchanged, ${changes.length} updated in place`);
  for (const change of changes) console.log(`  ~ ${change}`);

  if (added.length) {
    console.log(
      `\n${added.length} fixture(s) the stored season does not contain — ` +
        `check the club id mapping before adding them:`,
    );
    for (const f of added) console.log(`  + ${f.homeTeam} v ${f.awayTeam} (${f.date})`);
  }

  const missing = stored.fixtures.length - (unchanged + changes.length);
  if (missing > 0) {
    console.log(`\n${missing} stored fixture(s) were not in the provider response.`);
  }

  if (!write) {
    console.log("\nDry run. Re-run with --write to apply.");
    return;
  }

  stored.fixtures.sort((a, b) => a.kickoffTime.localeCompare(b.kickoffTime));
  stored.syncedAt = new Date().toISOString();
  await writeFile(DATA_FILE, `${JSON.stringify(stored, null, 2)}\n`);
  console.log(`\nWritten to ${path.relative(process.cwd(), DATA_FILE)}`);
  console.log("Run `npm run validate:pl` to re-check the season.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
