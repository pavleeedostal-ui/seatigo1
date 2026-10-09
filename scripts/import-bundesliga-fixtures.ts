/**
 * Builds the Bundesliga 2026/27 season seed.
 *
 *   npm run import:bundesliga
 *
 * Source: https://www.bundesliga.com/en/bundesliga/matchday/2026-2027/{1..34} —
 * see docs/ligue-1-bundesliga-import.md for why this reads a checked-in
 * extract instead of fetching.
 */
import path from "node:path";
import { runCompactImport, type CompactSeasonConfig } from "./lib/compact-season";

const DATA = path.join(process.cwd(), "src", "lib", "football", "data");

const config: CompactSeasonConfig = {
  competition: "bundesliga",
  season: "2026/27",
  idSeason: "2026-27",
  matchweeks: 34,
  clubsPerLeague: 18,
  timeZone: "Europe/Berlin",
  sourceUrl: "https://www.bundesliga.com/en/bundesliga/matchday",
  inFile: path.join(DATA, "bundesliga-2026-27.source.csv"),
  outFile: path.join(DATA, "bundesliga-2026-27.json"),
  clubs: {
    "0": "1. FC Köln",
    "1": "1. FC Union Berlin",
    "2": "1. FSV Mainz 05",
    "3": "Bayer 04 Leverkusen",
    "4": "Borussia Dortmund",
    "5": "Borussia Mönchengladbach",
    "6": "Eintracht Frankfurt",
    "7": "FC Augsburg",
    "8": "FC Bayern München",
    "9": "FC Schalke 04",
    A: "Hamburger SV",
    B: "RB Leipzig",
    C: "SC Paderborn 07",
    D: "SC Freiburg",
    E: "SV Elversberg",
    F: "SV Werder Bremen",
    G: "TSG Hoffenheim",
    H: "VfB Stuttgart",
  },
};

runCompactImport(config, 2026).catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
