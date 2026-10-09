# UEFA Europa League 2026/27 import

```bash
npm run import:uel        # fetch and rewrite the season seed
npm run sync:artwork      # crests + competition logos
npm run validate:seasons  # structural checks for all seven competitions
```

## Source

UEFA's own public match and round services, the same ones the Champions
League uses — only the competition id differs:

| What | Endpoint |
| --- | --- |
| Fixtures | `https://match.uefa.com/v5/matches?competitionId=14&seasonYear=2027` |
| Round calendar | `https://comp.uefa.com/v2/rounds?competitionId=14&seasonYear=2027` |

Plain `GET`, JSON, no key and no scraping of rendered markup. UEFA labels a
season by the year it *ends* in, so 2026/27 is `seasonYear=2027`.

Note the id: UEFA's Europa League is **competition 14**, not 2. Requesting
`competitionId=2&seasonYear=2027` returns a 404 — that id belongs to an older
competition with no 2026/27 season. Reference page:
<https://www.uefa.com/uefaeuropaleague/fixtures-results/>.

## Shared architecture

This competition added no new machinery. The Champions League work was
factored into three shared pieces, and the Europa League is a fourth file of
lookup tables plus a thin season module:

| File | Role |
| --- | --- |
| `src/lib/football/uefaSeason.ts` | Seed types, stage slugs, status mapping, `buildUefaSeason()` |
| `src/lib/football/uefaSource.ts` | The `UefaCompetitionSource` contract |
| `scripts/lib/uefa-import.ts` | Fetch, map, validate, write |
| `src/lib/football/europaLeagueSource.ts` | This competition's club and venue tables |
| `src/lib/football/europaLeagueSeason.ts` | Seed → `Match[]` + stage calendar |

Adding a third UEFA competition (the Conference League, say) is one source
module, one season module and one validator call.

The refactor was verified to be behaviour-preserving: re-running
`npm run import:ucl` afterwards produced a byte-identical Champions League
seed apart from its `importedAt` timestamp.

## What is imported

| Stage | Status |
| --- | --- |
| League phase | 144 fixtures, 36 clubs, 8 matchdays — complete |
| Knock-out play-off | calendar only (16 teams, two legs, 18–25 Feb 2027) |
| Round of 16 | calendar only (11–18 Mar 2027) |
| Quarter-finals | calendar only (8–15 Apr 2027) |
| Semi-finals | calendar only (29 Apr – 6 May 2027) |
| Final | calendar only (26 May 2027) |

All 144 league-phase fixtures have a confirmed kickoff in UTC and a verified
venue.

UEFA spells one round differently from the Champions League ("Knock-out
Play-off" vs "Knockout Round Play-Offs"); both spellings are mapped in
`STAGE_BY_UEFA_ROUND`, and an unmapped round stops the import rather than
being guessed at.

### Not yet published: the 2027 final venue

**UEFA has not announced where the 26 May 2027 final will be played, and it
is not in the feed.** The round record carries `dateFrom`/`dateTo` and
nothing else, and no match exists in that round. `europaLeagueSeason.ts`
therefore passes `finalVenue: null`, the stage card shows the confirmed date
with no ground, and `validate:seasons` prints a warning every run so the gap
stays visible instead of quietly passing.

When UEFA announces the host, add the stadium to `referenceData.ts` if it is
new and set `finalVenue` in `europaLeagueSeason.ts` — the same one-line shape
the Champions League uses for the Estadio Metropolitano.

This is the only item on the spec that could not be sourced.

### Deliberately not imported: the qualifying rounds

UEFA's feed also carries 80 fixtures from the three qualifying rounds and the
qualifying play-off, all played in July and August 2026. They are skipped for
the same reason as in the Champions League: they involve clubs that reach no
competition Seatigo covers, and importing them would mean dozens of club
records and crests for finished, unsellable matches. The `qualifying` stage
exists in the type system, so this is one line in `IMPORTED_STAGES`.

## Keeping it in sync

`npm run import:uel` **is** the sync. It re-reads everything from UEFA and
rewrites the seed, covering new knockout fixtures after a draw, reschedules,
kickoff changes, venue changes, completed matches, postponements and
cancellations.

Identity is UEFA's own match id (`uefa-<id>`), which survives a reschedule, so
a fixture that moves keeps its id, its URL and any ticket offers mapped to
it. The importer refuses to write a season that fails its structural checks,
so a bad upstream response leaves the committed data untouched.

## Club and venue identity

12 of the 36 clubs already played in a competition Seatigo covers and **reuse
their existing records** — Milan, Juventus, Marseille, Lyon, Leverkusen,
Hoffenheim, Rennes, Celta, Real Sociedad, Crystal Palace, Bournemouth and
Sunderland. 24 were added. No club has two records.

Points worth knowing, all of them UEFA's own data rather than quirks of the
import:

- **Union Saint-Gilloise use two home grounds** this season — Den Dreef in
  Leuven and the Düsseldorf Arena. Venue is stored per fixture, not per club,
  so both are represented correctly.
- **Hapoel Beer-Sheva host at the Giuleşti Stadium in Bucharest.** The club
  record keeps Be'er Sheva, Israel as the club's own city; the fixture's city
  and country come from the venue.
- **UEFA strips sponsor names**, so "Juventus Stadium" is the Allianz Stadium
  and "Rhein-Neckar-Arena" is Hoffenheim's PreZero Arena. Both map back onto
  the existing records: one physical ground, one record.
- **FC Salzburg** is UEFA's sponsor-free listing of Red Bull Salzburg; the
  common name is kept as an alias so search finds it either way.
- Capacities are UEFA's figures for its own matches, which can differ from the
  domestic listing (Bournemouth's ground is listed at 9,307).

## Crest verification

All 24 new crests were rendered and **inspected by eye** against the club
they are assigned to, as were all 36 as finally served from
`/public/images/clubs`. Filenames were not trusted on their own.

Every one uses UEFA's own team artwork, keyed by the UEFA team id taken *from
the fixture record the club appears in* — an id that cannot be mis-assigned,
because it is not the result of a lookup by name. Unlike the Champions
League, no club needed a second source: every UEFA crest here is the current
full-colour version.

The competition logo is UEFA's current lockup (the orange octagon trophy)
from their own brand asset host, replacing the provider's older rendering. It
is used as published; no imitation is generated.

Rights: see `docs/club-crests.md` and `docs/competition-logos.md`.

## Fixture slugs

Europa League fixtures carry a `-uel` suffix, and knockout fixtures also
carry their stage: `lyon-vs-crystal-palace-uel`,
`benfica-vs-celtic-uel-round-of-16`.

Without it, a European tie between two clubs from the same domestic league
would collide with their league meeting, and a pair meeting again in a later
round would collide with itself. `buildUefaSeason` throws on a duplicate slug
and `validate:seasons` checks it too.
