# Serie A Enilive 2026/27

## How the season got here

`npm run import:seriea` (`scripts/import-serie-a-fixtures.ts`) builds
`src/lib/football/data/serie-a-2026-27.json` from a checked-in extract of Lega
Serie A's published schedule:

    https://en.legaseriea.it/serie-a/fixtures-results

**This importer reads a file rather than fetching**, which is the one place
Serie A differs from the Premier League and La Liga. Lega Serie A's schedule
cannot be fetched server-side: the page server-renders only the current
matchday, all 38 live in the fixtures widget's client state, and stepping
between them fires no network request. A `curl` of the page contains zero
occurrences of `Home team:`, `Frosinone` or `Venezia`.

The extract (`data/serie-a-2026-27.source.tsv`) was therefore taken from the
rendered widget, and its transfer verified by SHA-256 against the in-browser
copy before anything was built on it.

### Reproducing the extract

Load the page, then drive the widget:

- Buttons `aria-label="Next matchday"` / `"Previous matchday"`; they **wrap
  around** past 38, so stepping forward 40 times from any start collects all
  of them. Key results by the matchday you read, not by step count.
- Each fixture is `article.dfw-fixture-item`. Parse from its `innerText`, not
  its `aria-label`: the label becomes `"Inter 4 vs Monza 1"` once played,
  whereas the text keeps a stable `Home team: X.Away team: Y.` plus
  `Match completed.`
- Dates come from the preceding `h3[aria-label^="Match date:"]` (carries the
  year); kickoff is the `HH:MM` in the fixture text.

Columns in the TSV: matchweek, date, kickoff (Europe/Rome, blank when
unscheduled), home, away, completed(0|1).

## Kick-off times

Matchweeks 1–19 are scheduled: real dates spread across a weekend, real times.
Matchweeks 20–38 are not: all ten fixtures in a week share one nominal
Saturday date and have no time — a week marker, not a matchday.

Those are stored the La Liga way: `date: null`, `kickoffTime: null`, with
`nominalDate` kept for ordering only. Serie A publishes no default kickoff to
fall back on, so unlike the Premier League nothing is marked provisional.

At import: **190 of 380 with a confirmed kickoff, 190 still to be scheduled**,
50 completed, and zero completed fixtures missing a time — the check that
confirms the placeholder reading.

Times are Europe/Rome wall-clock, converted to UTC with real CET/CEST
handling (18:30 in August → 16:30Z; 12:30 in January → 11:30Z).

## Venues

Lega Serie A's schedule does not publish venues. Only the five clubs with a
venue already verified in `referenceData.ts` carry a stadium (Inter, AC Milan,
Juventus, Napoli, Roma — 95 of 380 fixtures); the other 15 clubs' home
fixtures show "Venue to be confirmed". Add entries to `VERIFIED_HOME_VENUE` in
`serieASeason.ts` to fill them in.

## Clubs and crests

All 20 participating clubs, including the three promoted sides (Venezia FC,
Frosinone Calcio, AC Monza). 15 were new; Inter, AC Milan, Juventus, Napoli
and Roma already existed and kept their slugs (Juventus and Napoli were
renamed to their official full names).

**Every crest was visually verified against its club.** That check caught a
real error: football-data.org id `1049` serves a green/yellow "CDT" crest that
is not Como. Como therefore carries an explicit `crestUrl` pointing at Lega
Serie A's own club logo. Supporting that meant teaching `crest-io.ts` to
handle `.webp`, which it previously would have saved as `.svg`.

## Competition logo

The provider serves the superseded **Serie A TIM** mark. The registry entry
carries an explicit `logoUrl` for the current **Serie A Enilive** lockup from
the league's own site, verified side by side against the old one.

## Synchronization and validation

    npm run sync:fixtures      # approved API, upserts on stable internal ids
    npm run validate:seasons   # checks all three imported seasons

Internal fixture ids are derived from the pairing and season
(`seriea-2026-27-<home>-v-<away>`), never the date, so a reschedule updates a
fixture in place instead of creating a duplicate.
