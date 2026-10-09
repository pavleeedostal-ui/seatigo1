/**
 * Imports the UEFA Champions League season from UEFA's own public match and
 * round services:
 *
 *   npm run import:ucl
 *
 * All the work is in scripts/lib/uefa-import.ts, which the Europa League
 * importer shares. Source and rights: docs/champions-league-import.md.
 */
import { CHAMPIONS_LEAGUE_SOURCE } from "@/lib/football/championsLeagueSource";
import { runUefaImport } from "./lib/uefa-import";

runUefaImport(CHAMPIONS_LEAGUE_SOURCE).catch((error) => {
  console.error(error);
  process.exit(1);
});
