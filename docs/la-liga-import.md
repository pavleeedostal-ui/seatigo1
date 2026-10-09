# LALIGA EA SPORTS 2026/27

## How the season got here

`npm run import:laliga` (`scripts/import-la-liga-fixtures.ts`) builds
`src/lib/football/data/la-liga-2026-27.json` from the league's own published
matchweek pages:

    https://www.laliga.com/en-GB/laliga-easports/results/2026-27/gameweek-{1..38}

Each page embeds structured fixture data (`__NEXT_DATA__`), which is why this
source gives more than the Premier League article did: an external fixture id,
the matchweek, UTC kickoff, status, **and a venue for every fixture**.

As with the Premier League this is a **one-off seed import**, not a scraping
loop. The approved football API (football-data.org) is the path for ongoing
synchronization, but it needs a key and none is configured, so the season
could not be sourced from it. The importer refuses to write anything that
fails validation.

## Kick-off times

LALIGA schedules roughly two matchweeks ahead. Every fixture it has not yet
slotted carries a midnight placeholder (`T00:00:00+00:00`) on the matchweek's
nominal date, and all ten fixtures in such a week share that one date — it is
a week marker, not a matchday.

Those fixtures are therefore stored with **no date and no kickoff**, and the
UI shows "Date / Time TBC" beside the matchweek. Presenting the nominal date
as the matchday would be inventing one. The nominal date is kept in a separate
`nominalDate` field used only to keep unscheduled fixtures in sensible order.

At import: **100 of 380 fixtures had a confirmed kickoff, 280 did not**. Zero
completed fixtures lacked a time, which is the check that confirms the
placeholder reading is correct.

This differs from the Premier League, where the source publishes a *stated
default* time (15:00 / 20:00 UK) — those are stored as real times flagged
`kickoffProvisional`. The two leagues publish different things, so Seatigo
records them differently rather than flattening both into one guess.

## Venues

All 380 fixtures carry a venue from the league feed. The city comes from the
home club, which is the only part the feed does not include.

## Clubs

All 20 participating clubs, including the three promoted sides (RC Deportivo
de La Coruña, Real Racing Club de Santander, Málaga CF). Every crest was
verified against its club before wiring.

football-data.org has no crest for Deportivo, Racing or Málaga, so those three
entries in `club-logos.ts` carry an explicit `crestUrl` pointing at LALIGA's
own club shield. Real Madrid, FC Barcelona and Atlético de Madrid keep the
crests they already had — no duplicate assets.

## Competition logo

The provider still serves the superseded *LaLiga Santander* mark, so the
registry entry carries an explicit `logoUrl` for the current LALIGA EA SPORTS
lockup from the league's own site. That artwork is 161x55, which is why
`CompetitionLogo` fixes height and lets width follow the aspect ratio.

## Synchronization and validation

    npm run sync:fixtures      # approved API, upserts on stable internal ids
    npm run validate:seasons   # checks both imported seasons

Internal fixture ids are derived from the pairing and season
(`laliga-2026-27-<home>-v-<away>`), never the date, so a reschedule updates a
fixture in place instead of creating a duplicate.
