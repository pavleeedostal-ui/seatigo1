import type { Match } from "@/types/football";
import { fixtureSortKey } from "@/types/football";
import { premierLeagueMatches } from "./premierLeagueSeason";
import { laLigaMatches } from "./laLigaSeason";
import { serieAMatches } from "./serieASeason";
import { ligue1Matches } from "./ligue1Season";
import { bundesligaMatches } from "./bundesligaSeason";
import { championsLeagueMatches } from "./championsLeagueSeason";
import { europaLeagueMatches } from "./europaLeagueSeason";

export { clubs, competitions, stadiums } from "./referenceData";

/**
 * The fixture database: every competition Seatigo covers, in kickoff order.
 *
 * There are no hand-written fixtures here any more. Every season is the real
 * published schedule imported from its organiser (see scripts/import-*.ts
 * and the per-competition docs), so nothing in this file is illustrative —
 * a fixture exists here only because someone published it.
 *
 * The provider (mockProvider.ts) decides what is *discoverable*; this is
 * only what exists, completed matches included.
 */
export const matches: Match[] = [
  ...premierLeagueMatches,
  ...laLigaMatches,
  ...serieAMatches,
  ...ligue1Matches,
  ...bundesligaMatches,
  ...championsLeagueMatches,
  ...europaLeagueMatches,
].sort((a, b) => fixtureSortKey(a).localeCompare(fixtureSortKey(b)));
