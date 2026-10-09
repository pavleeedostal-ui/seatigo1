# UEFA Champions League 2026/27 import

```bash
npm run import:ucl        # fetch and rewrite the season seed
npm run sync:artwork      # crests + competition logos
npm run validate:seasons  # structural checks for all six competitions
```

## Source

UEFA's own public match and round services — the ones uefa.com itself calls:

| What | Endpoint |
| --- | --- |
| Fixtures | `https://match.uefa.com/v5/matches?competitionId=1&seasonYear=2027` |
| Round calendar | `https://comp.uefa.com/v2/rounds?competitionId=1&seasonYear=2027` |

Both return JSON to a plain `GET` with no key, no session and no scraping of
rendered markup. UEFA labels a season by the year it *ends* in, so 2026/27 is
`seasonYear=2027`. Reference pages:
<https://www.uefa.com/uefachampionsleague/fixtures-results/>.

This replaces nothing: the five domestic leagues keep their own importers and
their own sources.

## Shared architecture

The structural work here is shared with the Europa League, which uses the
same services and the same season shape:

| File | Role |
| --- | --- |
| `src/lib/football/uefaSeason.ts` | Seed types, stage slugs, status mapping, `buildUefaSeason()` |
| `src/lib/football/uefaSource.ts` | The `UefaCompetitionSource` contract |
| `scripts/lib/uefa-import.ts` | Fetch, map, validate, write |
| `src/lib/football/championsLeagueSource.ts` | This competition's club and venue tables |
| `src/lib/football/championsLeagueSeason.ts` | Seed → `Match[]` + stage calendar |

See `docs/europa-league-import.md` for the sibling competition.

## Why this competition needed new structure

A domestic league is one flat double round-robin, and `matchweek` alone
describes it. The Champions League is not, in two ways that matter:

1. **It has stages.** `Match.stage` (`league_phase`, `round_of_16`, …) says
   which part of the season a fixture belongs to, and `Match.tie` groups the
   two legs of a knockout tie under one `tieId`.
2. **Half the season has dates but no teams.** The knockout rounds are on
   UEFA's calendar from the start and drawn months later.

Point 2 is the reason the seed has a `stages` array next to `fixtures`.
Fixtures only ever hold real, drawn matches. The calendar holds every round,
with `drawn: false` until its draw happens. The competition page renders an
undrawn round as a dated card reading *"Teams to be confirmed"* — no
placeholder clubs are created, ever, and `validate:seasons` fails the build
if an undrawn round contributes so much as one fixture.

## What is imported

| Stage | Status |
| --- | --- |
| League phase | 144 fixtures, 36 clubs, 8 matchdays — complete |
| Knockout play-offs | calendar only (16 teams, two legs, 16–24 Feb 2027) |
| Round of 16 | calendar only (9–17 Mar 2027) |
| Quarter-finals | calendar only (6–15 Apr 2027) |
| Semi-finals | calendar only (27 Apr – 6 May 2027) |
| Final | calendar only (5 Jun 2027, Estadio Metropolitano, Madrid) |

Every one of the 144 league-phase fixtures has a confirmed kickoff in UTC and
a verified venue, because UEFA publishes both.

### Deliberately not imported: the qualifying rounds

UEFA's feed also carries 90 fixtures from the three qualifying rounds and the
qualifying play-off, all played in July and August 2026. They are skipped.
They involve roughly forty clubs that reach no competition Seatigo covers, so
importing them would mean adding forty club records and forty crests for
fixtures that are finished and unsellable. The `qualifying` stage exists in
the type system, so the decision is one line in `IMPORTED_STAGES` if that
changes.

## Keeping it in sync

`npm run import:ucl` **is** the sync. It re-reads everything from UEFA and
rewrites the seed, so one command covers new knockout fixtures after a draw,
reschedules, kickoff changes, venue changes, completed matches, postponements
and cancellations.

It is safe to re-run: identity is UEFA's own match id (`uefa-<id>`), which
survives a reschedule, so a fixture that moves keeps its id, its URL and any
ticket offers mapped to it. Re-running with no upstream change rewrites only
`importedAt`.

The importer refuses to write a season that fails its structural checks, so a
bad upstream response leaves the committed data untouched.

`npm run sync:fixtures` is the Premier League's reconciler against
football-data.org and does not touch this competition.

## Club and venue identity

`src/lib/football/championsLeagueSource.ts` holds the two mapping tables that
join UEFA's vocabulary to Seatigo's. Both are explicit; nothing is matched by
fuzzy name comparison, and the importer throws on an unmapped club or venue
rather than guessing.

21 of the 36 clubs already played in a domestic league Seatigo covers and
**reuse their existing records**, so Arsenal is one club with one id and one
crest across the Premier League and the Champions League. 15 were added.

A few consequences of using UEFA's own venue data are worth knowing:

- **UEFA strips sponsor names.** Their feed says "Arsenal Stadium", "Fußball
  Arena München", "BVB Stadion Dortmund", "City of Manchester Stadium".
  These map back onto the existing Emirates / Allianz Arena / Signal Iduna
  Park / Etihad records: one physical ground, one record, under the name fans
  use. The single exception is the final, billed as the **Estadio
  Metropolitano** because it is a UEFA event at a neutral venue rather than
  an Atlético home match.
- **Shakhtar Donetsk host at Stamford Bridge, London.** That is UEFA's
  listing, not a bug. The club record keeps Donetsk, Ukraine as the club's
  own city; the fixture's city comes from the venue.
- **Real Betis host at La Cartuja de Sevilla**, and Aston Villa's Villa Park
  capacity is UEFA's reduced figure for its own matches. Capacities here are
  whatever UEFA publishes for these fixtures, which can differ from the
  domestic listing.

## Crest verification

Every one of the 15 new crests was rendered and **inspected by eye** against
the club it is assigned to, as were all 36 as finally served from
`/public/images/clubs`. Filenames and ids were not trusted on their own — a
previous import assigned Como a crest belonging to another club entirely
because an id looked right.

Two sources are used:

- **football-data.org**, where it covers the club and the id was confirmed
  visually: Club Brugge (851), Galatasaray (610), LASK (2016), Porto (503),
  PSV (674), Shakhtar (1887), Sporting CP (498).
- **UEFA's own team artwork** for the other eight, keyed by the UEFA team id
  taken *from the fixture record the club appears in*. That id cannot be
  mis-assigned, because it is not the result of a lookup by name.

Sporting CP is the one case where the sources disagreed in quality: UEFA
serves a flat single-colour mark, so football-data's current full-colour
crest is used instead.

The competition logo comes from UEFA's own brand asset host
(`.../logos/competitions/color/full/1.svg`) rather than the provider's older
flat black starball. It is UEFA's current navy lockup, used as published —
no imitation is generated.

Crest and logo rights: see `docs/club-crests.md` and
`docs/competition-logos.md`. Both are club and competition trade marks, used
to identify the fixture being listed.

## Fixture slugs

Champions League fixtures carry a `-ucl` suffix, and knockout fixtures also
carry their stage: `arsenal-vs-lille-ucl`,
`arsenal-vs-inter-milan-ucl-round-of-16`.

This is the first competition whose clubs also meet each other elsewhere.
Without the suffix a knockout tie between two Spanish clubs would collide
with their La Liga meeting, and a pair that meets in both the league phase
and the Round of 16 would collide with itself. `championsLeagueSeason.ts`
throws at import on a duplicate slug, and `validate:seasons` checks it too.
