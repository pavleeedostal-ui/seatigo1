/**
 * Imports the UEFA Europa League season from UEFA's own public match and
 * round services:
 *
 *   npm run import:uel
 *
 * All the work is in scripts/lib/uefa-import.ts, which the Champions League
 * importer shares. Source and rights: docs/europa-league-import.md.
 */
import { EUROPA_LEAGUE_SOURCE } from "@/lib/football/europaLeagueSource";
import { runUefaImport } from "./lib/uefa-import";

runUefaImport(EUROPA_LEAGUE_SOURCE).catch((error) => {
  console.error(error);
  process.exit(1);
});
