# Ligue 1 McDonald's & Bundesliga 2026/27

## Why these two share an importer

Neither league's calendar can be fetched server-side:

- **ligue1.com** server-renders only the shell; `__NEXT_DATA__` carries just
  `{competition: "ligue1"}` and the `_next/data` endpoint returns the same.
- **bundesliga.com** is an Angular app; a `curl` of a matchday page contains
  no fixtures, and stepping between matchdays fires no data request.

Both were therefore extracted from the rendered page into a compact CSV under
`src/lib/football/data/`, and each transfer was verified by SHA-256 against
the in-browser copy before anything was built on it
(`ae57abae6c7d4080aa31` / `31121504ef960f3f56a7`).

`scripts/lib/compact-season.ts` turns either CSV into a season seed with the
same shape and the same validation contract as the three fetch-based
importers. `src/lib/football/compactSeason.ts` is the matching runtime
builder, so `ligue1Season.ts` and `bundesligaSeason.ts` stay as thin as the
other three season modules.

    npm run import:ligue1
    npm run import:bundesliga

### Reproducing the extracts

**Ligue 1** — `?gameweek=N` is a real URL param, but stepping with the
`aria-label="Next day"` button is faster (client-side). Each fixture is an
`<a href="/en/match-sheet/l1_championship_match_NNNNN">` whose text is
`(pos) Home TIME Away (pos)`; a played match shows `4 - 0` in place of the
time and an unscheduled one shows `- -`. The provider's own fixture id comes
from the href and is kept as the external id.

**Bundesliga** — matchdays are addressable at
`/en/bundesliga/matchday/2026-2027/N`. Each fixture is an `<a>` ending in
`/liveticker` whose path carries both club slugs. Note that matchdays 1–4
render every fixture link **twice**, so dedupe by pairing or you get 342
fixtures instead of 306.

## Kick-off times

| | Ligue 1 | Bundesliga |
|---|---:|---:|
| confirmed kickoff | 63 | 72 |
| dated, no time | 45 | 36 |
| no published date | 198 | 198 |

Both leagues schedule only a few matchweeks ahead. A future fixture with no
time carries only its matchweek's marker date — every fixture in the week
shares it — so it is stored with `date: null` and shown as "Date / Time TBC",
exactly as for La Liga and Serie A. A **completed** fixture's date is real and
is kept; neither publisher shows the kickoff time of a played match (the score
replaces it), so those keep a date and no time rather than claiming one. The
season validator has `completedHaveKickoff: false` for both leagues for that
reason.

Times are converted from Europe/Paris and Europe/Berlin wall-clock to UTC.

## Known source discrepancy — Ligue 1

The published calendar lists **Stade Rennais FC v Paris Saint-Germain in both
matchweek 1 and matchweek 23**, and never lists PSG v Rennes. Verified against
the fixture links' own `aria-label`s, so it is the source's data, not a parse
error. It leaves Rennes with 18 home / 16 away and PSG with 16 home / 18 away.

It is imported exactly as published. The reverse fixture is **not** invented.
Both the importer and `npm run validate:seasons` print it as a warning on
every run so it cannot be forgotten, and it is declared explicitly in
`KNOWN_SOURCE_ISSUES` — a *new* imbalance would still fail the check.

## Venues

Neither calendar publishes venues. Only clubs with a venue already verified in
`referenceData.ts` carry a stadium: PSG, Marseille and Monaco (50 of 306
Ligue 1 fixtures); Bayern, Dortmund and Leipzig (51 of 306 Bundesliga
fixtures). Everything else shows "Venue to be confirmed". Add entries to
`VERIFIED_HOME_VENUE` in the season module to fill them in.

## Crests and competition logos

All 36 clubs' crests come from each league's own CDN — ligue1.com for the
French clubs, `assets.bundesliga.com/clublogos/…` for the German ones — because
football-data.org does not cover the promoted sides. **Every crest was
visually verified against its club.**

The **Bundesliga** competition logo already in the manifest is the current
mark and was kept after comparing it side by side with the league's own asset.

**The Ligue 1 McDonald's logo is the one asset that remains missing.** The
league publishes only negative (white) lockups —
`Logo_Ligue_1.webp` and `Logo_Ligue1.webp` — which are invisible on Seatigo's
white cards, and no positive variant is served (11 filename variants probed).
Seatigo therefore keeps the provider's older but legible `LIGUE 1` mark rather
than recolouring official branding or giving one competition its own dark
chip. Drop a positive lockup into `public/images/competitions/ligue-1.*` and
point the registry's `logoUrl` at it to fix this.
