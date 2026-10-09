/**
 * Builds the Ligue 1 McDonald's 2026/27 season seed.
 *
 *   npm run import:ligue1
 *
 * Source: https://ligue1.com/en/calendar/ligue1 — see docs/ligue-1-bundesliga-import.md
 * for why this reads a checked-in extract instead of fetching.
 */
import path from "node:path";
import { runCompactImport, type CompactSeasonConfig } from "./lib/compact-season";

const DATA = path.join(process.cwd(), "src", "lib", "football", "data");

const config: CompactSeasonConfig = {
  competition: "ligue-1",
  season: "2026/27",
  idSeason: "2026-27",
  matchweeks: 34,
  clubsPerLeague: 18,
  timeZone: "Europe/Paris",
  sourceUrl: "https://ligue1.com/en/calendar/ligue1",
  inFile: path.join(DATA, "ligue-1-2026-27.source.csv"),
  outFile: path.join(DATA, "ligue-1-2026-27.json"),
  hasExternalId: true,
  externalIdPrefix: "l1_championship_match_",
  clubs: {
    "0": "AJ Auxerre",
    "1": "AS Monaco",
    "2": "Angers SCO",
    "3": "Stade Brestois 29",
    "4": "FC Lorient",
    "5": "Le Havre AC",
    "6": "Le Mans FC",
    "7": "LOSC Lille",
    "8": "OGC Nice",
    "9": "Olympique Lyonnais",
    A: "Olympique de Marseille",
    B: "Paris Saint-Germain",
    C: "Paris FC",
    D: "RC Lens",
    E: "Stade Rennais FC",
    F: "RC Strasbourg Alsace",
    G: "Toulouse FC",
    H: "ESTAC Troyes",
  },
};

/**
 * The published calendar lists Rennes v PSG in both matchweek 1 and matchweek
 * 23 and never lists PSG v Rennes. Confirmed against the fixture links' own
 * aria-labels, so it is the source's data, not a parse error. Imported as
 * published rather than silently inventing the reverse fixture.
 */
const KNOWN_SOURCE_ISSUES = [
  "duplicate pairing: Stade Rennais FC v Paris Saint-Germain",
  "SOURCE: Paris Saint-Germain has 16 home / 18 away (expected 17 / 17)",
  "SOURCE: Stade Rennais FC has 18 home / 16 away (expected 17 / 17)",
];

runCompactImport(config, 2026, KNOWN_SOURCE_ISSUES).catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
