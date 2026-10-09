/**
 * Checks each imported season against its structural invariants, as it sits
 * in the running application (not in the raw JSON).
 *
 *   npm run validate:seasons
 *
 * Exits non-zero on any failure, so it can gate a deploy.
 */
import { premierLeagueMatches, PREMIER_LEAGUE_SEASON } from "@/lib/football/premierLeagueSeason";
import { laLigaMatches, LA_LIGA_SEASON } from "@/lib/football/laLigaSeason";
import { serieAMatches, SERIE_A_SEASON } from "@/lib/football/serieASeason";
import { ligue1Matches, LIGUE_1_SEASON } from "@/lib/football/ligue1Season";
import { bundesligaMatches, BUNDESLIGA_SEASON } from "@/lib/football/bundesligaSeason";
import {
  championsLeagueMatches,
  CHAMPIONS_LEAGUE_SEASON,
  CHAMPIONS_LEAGUE_STAGES,
} from "@/lib/football/championsLeagueSeason";
import {
  europaLeagueMatches,
  EUROPA_LEAGUE_SEASON,
  EUROPA_LEAGUE_STAGES,
} from "@/lib/football/europaLeagueSeason";
import { MockFootballDataProvider } from "@/lib/football/mockProvider";
import { resolveClubCrest } from "@/lib/football/club-logos";
import { resolveCompetitionLogo } from "@/lib/football/competition-logos";
import type { Match, StageCalendarEntry } from "@/types/football";
import { isKnockoutStage, isUpcomingStatus } from "@/types/football";


let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

interface SeasonExpectations {
  clubs: number;
  matchweeks: number;
  /**
   * Some sources publish the kickoff time of a completed match, some only the
   * date. Off for leagues whose calendar replaces the time with the score.
   */
  completedHaveKickoff?: boolean;
  /**
   * Home/away imbalances the source itself publishes. Reported every run as a
   * warning so they stay visible, but they are the source's data, not a bug
   * here, and never invented away.
   */
  knownSourceIssues?: string[];
}

async function checkSeason(
  label: string,
  season: (typeof premierLeagueMatches)[number][],
  competitionSlug: string,
  expect: SeasonExpectations = { clubs: 20, matchweeks: 38 },
) {
  const perClub = expect.matchweeks;
  const perSide = perClub / 2;
  const expectedFixtures = expect.matchweeks * (expect.clubs / 2);
  const clubs = [...new Set(season.flatMap((m) => [m.homeTeam, m.awayTeam]))];

  console.log(`\n${label}\n`);

  check(
    `Exactly ${expect.clubs} participating clubs`,
    clubs.length === expect.clubs,
    `${clubs.length} clubs`,
  );

  check(
    `Complete ${expectedFixtures}-match season schedule`,
    season.length === expectedFixtures,
    `${season.length} fixtures`,
  );

  const wrongCount = clubs.filter(
    (c) =>
      season.filter((m) => m.homeTeam.id === c.id || m.awayTeam.id === c.id).length !==
      perClub,
  );
  check(
    `Every club has ${perClub} league fixtures`,
    wrongCount.length === 0,
    wrongCount.map((c) => c.name).join(", "),
  );

  const badSides = clubs.filter(
    (c) =>
      season.filter((m) => m.homeTeam.id === c.id).length !== perSide ||
      season.filter((m) => m.awayTeam.id === c.id).length !== perSide,
  );
  const unexpectedSides = badSides.filter(
    (c) => !(expect.knownSourceIssues ?? []).includes(c.name),
  );
  check(
    `Every club has ${perSide} home and ${perSide} away fixtures`,
    unexpectedSides.length === 0,
    unexpectedSides.map((c) => c.name).join(", "),
  );
  for (const club of badSides.filter((c) =>
    (expect.knownSourceIssues ?? []).includes(c.name),
  )) {
    const home = season.filter((m) => m.homeTeam.id === club.id).length;
    console.log(
      `⚠ source discrepancy: ${club.name} has ${home} home / ${perClub - home} away ` +
        `(the published calendar itself; imported as-is, not corrected)`,
    );
  }

  const selfPlay = season.filter((m) => m.homeTeam.id === m.awayTeam.id);
  check("No fixture has the same club on both sides", selfPlay.length === 0);

  const pairings = season.map((m) => `${m.homeTeam.id}|${m.awayTeam.id}`);
  const dupPairs = [...new Set(pairings.filter((p, i) => pairings.indexOf(p) !== i))];
  const dupNames = dupPairs.map((p) => {
    const m = season.find((x) => `${x.homeTeam.id}|${x.awayTeam.id}` === p)!;
    return `${m.homeTeam.name} v ${m.awayTeam.name}`;
  });
  const unexpectedDups = dupNames.filter(
    (n) => !(expect.knownSourceIssues ?? []).includes(n),
  );
  check("No duplicate fixtures", unexpectedDups.length === 0, unexpectedDups.join(", "));
  for (const n of dupNames.filter((n) => (expect.knownSourceIssues ?? []).includes(n))) {
    console.log(`⚠ source discrepancy: ${n} is listed twice by the publisher`);
  }

  const ids = season.map((m) => m.id);
  check("Internal fixture ids are unique", new Set(ids).size === ids.length);

  const weeks = [...new Set(season.map((m) => m.matchweek))].sort((a, b) => (a ?? 0) - (b ?? 0));
  const perWeek = expect.clubs / 2;
  const badWeeks = weeks.filter(
    (w) => season.filter((m) => m.matchweek === w).length !== perWeek,
  );
  check(
    `${expect.matchweeks} matchweeks of ${perWeek} fixtures`,
    weeks.length === expect.matchweeks && badWeeks.length === 0,
    `${weeks.length} matchweeks`,
  );

  const wrongComp = season.filter((m) => m.competition.slug !== competitionSlug);
  check("Every fixture is on the right competition", wrongComp.length === 0);

  // A fixture may legitimately have no confirmed slot yet; a *completed* one
  // may not, because it was played.
  const finishedWithoutTime = season.filter(
    (m) => m.status === "finished" && !m.kickoffTime,
  );
  if (expect.completedHaveKickoff !== false) {
    check("Every completed fixture has a kickoff time", finishedWithoutTime.length === 0);
  } else {
    console.log(
      `  ${finishedWithoutTime.length} completed fixture(s) have a date but no time ` +
        `(this publisher replaces the kickoff with the score once played)`,
    );
  }

  const scheduled = season.filter((m) => m.kickoffTime).length;
  const provisional = season.filter((m) => m.kickoffProvisional).length;
  console.log(
    `  ${scheduled}/${season.length} with a kickoff time` +
      (provisional ? `, ${provisional} of them provisional` : "") +
      `, ${season.length - scheduled} still to be scheduled`,
  );
  console.log(
    `  ${season.filter((m) => m.stadium).length}/${season.length} with a verified venue`,
  );

  const missingCrest = clubs.filter((c) => !resolveClubCrest(c));
  check(
    "Every participating club has a crest",
    missingCrest.length === 0,
    missingCrest.map((c) => c.name).join(", "),
  );

  check(
    "Competition logo resolves",
    Boolean(resolveCompetitionLogo(season[0].competition)),
  );

  // Discovery behaviour, through the provider the app actually uses.
  const provider = new MockFootballDataProvider();
  const { matches: discoverable } = await provider.getMatches({
    competition: competitionSlug,
    pageSize: 1000,
  });
  const finished = season.filter((m) => !isUpcomingStatus(m.status));
  check(
    "Completed fixtures are excluded from upcoming-only views",
    discoverable.every((m) => isUpcomingStatus(m.status)) &&
      discoverable.length === season.length - finished.length,
    `${finished.length} completed, ${discoverable.length} upcoming`,
  );

  check(
    "Completed fixtures remain in the database",
    season.length === discoverable.length + finished.length,
  );
}

/**
 * A competition with a league phase and a knockout bracket cannot be held to
 * the domestic contract — it has no home-and-away double round-robin, and
 * half its season has dates but no teams. So it gets its own checks, and
 * they distinguish between the two:
 *
 *   - the league phase must be structurally complete, now;
 *   - a knockout round must be either fully drawn or not drawn at all,
 *     and an undrawn one must contribute no fixtures whatsoever.
 *
 * The second half is what stops a placeholder matchup from ever reaching
 * the database. A round that is "half drawn" is a bug, not a state.
 */
async function checkStagedSeason(
  label: string,
  season: Match[],
  stages: StageCalendarEntry[],
  competitionSlug: string,
  expect: {
    clubs: number;
    matchdays: number;
    fixtures: number;
    /** False while the organiser has not yet announced the final's host. */
    finalVenueKnown?: boolean;
  },
) {
  console.log(`\n${label}\n`);

  const phase = season.filter((m) => m.stage === "league_phase");
  const clubs = [...new Set(phase.flatMap((m) => [m.homeTeam, m.awayTeam]))];
  const perSide = expect.matchdays / 2;

  check(
    `Exactly ${expect.clubs} participating clubs`,
    clubs.length === expect.clubs,
    `${clubs.length} clubs`,
  );
  check(
    `Complete ${expect.fixtures}-fixture league phase`,
    phase.length === expect.fixtures,
    `${phase.length} fixtures`,
  );

  const wrongCount = clubs.filter(
    (c) =>
      phase.filter((m) => m.homeTeam.id === c.id || m.awayTeam.id === c.id).length !==
      expect.matchdays,
  );
  check(
    `Every club plays ${expect.matchdays} league-phase matches`,
    wrongCount.length === 0,
    wrongCount.map((c) => c.name).join(", "),
  );

  const badSides = clubs.filter(
    (c) =>
      phase.filter((m) => m.homeTeam.id === c.id).length !== perSide ||
      phase.filter((m) => m.awayTeam.id === c.id).length !== perSide,
  );
  check(
    `Every club has ${perSide} home and ${perSide} away fixtures`,
    badSides.length === 0,
    badSides.map((c) => c.name).join(", "),
  );

  const matchdays = [...new Set(phase.map((m) => m.matchweek))];
  const badDays = matchdays.filter(
    (d) => phase.filter((m) => m.matchweek === d).length !== expect.clubs / 2,
  );
  check(
    `${expect.matchdays} matchdays of ${expect.clubs / 2} fixtures`,
    matchdays.length === expect.matchdays && badDays.length === 0,
    `${matchdays.length} matchdays`,
  );

  // In a league phase a club meets each opponent once, in one direction
  // only — so a repeat in *either* direction is a duplicate.
  const meetings = phase.map((m) => [m.homeTeam.id, m.awayTeam.id].sort().join("|"));
  const dupes = [...new Set(meetings.filter((p, i) => meetings.indexOf(p) !== i))];
  check("No club meets another twice in the league phase", dupes.length === 0);
  check(
    "No fixture has the same club on both sides",
    phase.every((m) => m.homeTeam.id !== m.awayTeam.id),
  );

  const ids = season.map((m) => m.id);
  check("Internal fixture ids are unique", new Set(ids).size === ids.length);
  const slugs = season.map((m) => m.slug);
  check("Fixture slugs are unique", new Set(slugs).size === slugs.length);

  check(
    "Every fixture is on the right competition",
    season.every((m) => m.competition.slug === competitionSlug),
  );
  check("Every fixture carries a stage", season.every((m) => m.stage));

  // --- Knockout bracket -----------------------------------------------
  const knockoutStages = stages.filter((s) => isKnockoutStage(s.stage));
  check(
    "All five knockout rounds are on the calendar",
    knockoutStages.length === 5,
    knockoutStages.map((s) => s.stage).join(", "),
  );

  const undrawn = knockoutStages.filter((s) => !s.drawn);
  const leaked = undrawn.filter((s) => season.some((m) => m.stage === s.stage));
  check(
    "Undrawn rounds contribute no fixtures",
    leaked.length === 0,
    leaked.map((s) => s.name).join(", "),
  );

  const finalStage = stages.find((s) => s.stage === "final");
  check("The final is a single match", finalStage?.legs === 1);
  if (expect.finalVenueKnown === false) {
    check("The final has a confirmed date", Boolean(finalStage?.dateFrom), finalStage?.dateFrom);
    // Reported every run so it stays visible rather than quietly passing:
    // the venue is genuinely unpublished, not missing through an import bug.
    console.log(
      "⚠ the organiser has not announced this final's venue; the stage shows " +
        "its date with no ground rather than a guessed one",
    );
  } else {
    check(
      "The final has a confirmed date and venue",
      Boolean(finalStage?.dateFrom && finalStage?.stadium),
      finalStage ? `${finalStage.dateFrom} · ${finalStage.stadium?.name}` : "",
    );
  }
  check(
    "Two-legged rounds are marked as two legs",
    knockoutStages.every((s) => (s.stage === "final" ? s.legs === 1 : s.legs === 2)),
  );

  // Ties, for whatever has been drawn. Nothing yet, by design — but the
  // contract is checked now so a future draw cannot land unverified.
  const knockoutFixtures = season.filter((m) => m.stage && isKnockoutStage(m.stage));
  check(
    "Every knockout fixture belongs to a tie",
    knockoutFixtures.every((m) => m.tie?.tieId),
  );
  const ties = new Map<string, Match[]>();
  for (const m of knockoutFixtures) {
    const list = ties.get(m.tie!.tieId) ?? [];
    list.push(m);
    ties.set(m.tie!.tieId, list);
  }
  const brokenTies = [...ties.entries()].filter(([, legs]) => {
    const expectedLegs = legs[0].stage === "final" ? 1 : 2;
    if (legs.length !== expectedLegs) return true;
    if (expectedLegs === 1) return legs[0].tie!.leg !== null;
    // Two legs, numbered 1 and 2, with the home side swapped.
    return (
      legs.map((l) => l.tie!.leg).sort().join(",") !== "1,2" ||
      legs[0].homeTeam.id === legs[1].homeTeam.id
    );
  });
  check(
    "Every drawn tie has the right legs, numbered and reversed",
    brokenTies.length === 0,
    brokenTies.map(([id]) => id).join(", "),
  );
  check(
    "No fixture names a club that has not qualified",
    knockoutFixtures.every(
      (m) => clubs.some((c) => c.id === m.homeTeam.id) && clubs.some((c) => c.id === m.awayTeam.id),
    ),
  );

  console.log(
    `  ${season.filter((m) => m.kickoffTime).length}/${season.length} with a kickoff time`,
  );
  console.log(
    `  ${season.filter((m) => m.stadium).length}/${season.length} with a verified venue`,
  );
  for (const stage of stages) {
    const count = season.filter((m) => m.stage === stage.stage).length;
    console.log(
      `  ${stage.name.padEnd(26)} ${stage.dateFrom} → ${stage.dateTo}  ` +
        (stage.drawn ? `${count} fixtures` : "awaiting draw — calendar only"),
    );
  }

  const missingCrest = clubs.filter((c) => !resolveClubCrest(c));
  check(
    "Every participating club has a crest",
    missingCrest.length === 0,
    missingCrest.map((c) => c.name).join(", "),
  );
  check("Competition logo resolves", Boolean(resolveCompetitionLogo(season[0].competition)));

  const provider = new MockFootballDataProvider();
  const { matches: discoverable } = await provider.getMatches({
    competition: competitionSlug,
    pageSize: 1000,
  });
  const finished = season.filter((m) => !isUpcomingStatus(m.status));
  check(
    "Completed fixtures are excluded from upcoming-only views",
    discoverable.every((m) => isUpcomingStatus(m.status)) &&
      discoverable.length === season.length - finished.length,
    `${finished.length} completed, ${discoverable.length} upcoming`,
  );
  check(
    "Completed fixtures remain in the database",
    season.length === discoverable.length + finished.length,
  );
}

async function main() {
  await checkSeason(
    `Premier League ${PREMIER_LEAGUE_SEASON}`,
    premierLeagueMatches,
    "premier-league",
  );
  await checkSeason(`LALIGA EA SPORTS ${LA_LIGA_SEASON}`, laLigaMatches, "la-liga");
  await checkSeason(`Serie A Enilive ${SERIE_A_SEASON}`, serieAMatches, "serie-a");
  await checkSeason(`Ligue 1 McDonald's ${LIGUE_1_SEASON}`, ligue1Matches, "ligue-1", {
    clubs: 18,
    matchweeks: 34,
    completedHaveKickoff: false,
    // The published calendar lists Rennes v PSG twice and never lists the
    // reverse fixture. Verified against the source's own markup.
    knownSourceIssues: [
      "Stade Rennais FC v Paris Saint-Germain",
      "Paris Saint-Germain",
      "Stade Rennais FC",
    ],
  });
  await checkSeason(`Bundesliga ${BUNDESLIGA_SEASON}`, bundesligaMatches, "bundesliga", {
    clubs: 18,
    matchweeks: 34,
    completedHaveKickoff: false,
  });
  await checkStagedSeason(
    `UEFA Champions League ${CHAMPIONS_LEAGUE_SEASON}`,
    championsLeagueMatches,
    CHAMPIONS_LEAGUE_STAGES,
    "champions-league",
    { clubs: 36, matchdays: 8, fixtures: 144 },
  );
  await checkStagedSeason(
    `UEFA Europa League ${EUROPA_LEAGUE_SEASON}`,
    europaLeagueMatches,
    EUROPA_LEAGUE_STAGES,
    "europa-league",
    // UEFA has not announced the 2027 final's host, so unlike the Champions
    // League this one is not expected to carry a venue yet.
    { clubs: 36, matchdays: 8, fixtures: 144, finalVenueKnown: false },
  );

  console.log(
    failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`,
  );
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
