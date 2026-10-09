# Premier League 2026/27

## How the season got here

`npm run import:pl` (`scripts/import-premier-league-fixtures.ts`) builds
`src/lib/football/data/premier-league-2026-27.json` from the league's own
published fixture list:

    https://www.premierleague.com/en/news/4675097/all-380-fixtures-for-202627-premier-league-season

This is a **one-off seed import**, not a scraping loop. The approved football
API (football-data.org) is the path for ongoing synchronization — see below —
but it needs a key, and none is configured in this project, so the season
could not be sourced from it.

The importer refuses to write anything that fails validation, so a bad parse
cannot silently become fixture data.

### Two things the source needed resolving

**In-place amendments.** The article is edited when a fixture moves, which can
leave one pairing listed on both its old and its new date. The importer keeps
the listing with a confirmed kick-off time (the broadcast selection) and drops
the other. One such amendment exists today: Liverpool v Brighton & Hove Albion,
listed on both 24 and 25 October.

**Kick-off times.** The article states: *"The kick-off times of weekend and
Bank Holiday matches are 15:00 UK time, while for midweek matches it is 20:00
unless otherwise stated."* 140 fixtures carry an explicit time; the other 240
fall back on that stated default and are flagged `kickoffProvisional`, which
the UI renders as "Time may change". No time is invented — a fixture either
has a listed time or the league's published default, and the two are
distinguishable in the data.

Times are stored in UTC, converted from Europe/London wall-clock with real
BST/GMT handling.

## Venues

The fixture list does not publish venues. Only clubs with a venue already
verified in `referenceData.ts` carry a stadium (Arsenal, Chelsea, Liverpool,
Manchester City, Manchester United, Newcastle United, Tottenham Hotspur). The
other 13 clubs' home fixtures show "Venue to be confirmed" rather than a
guessed ground. Add a verified venue to `VERIFIED_HOME_VENUE` in
`premierLeagueSeason.ts` to fill one in.

## Ongoing synchronization

    npm run sync:fixtures            # dry run, reports what would change
    npm run sync:fixtures -- --write # apply

Requires `FOOTBALL_DATA_API_KEY`. It upserts on the **stable internal fixture
id**, which is derived from the pairing and the season
(`pl-2026-27-<home>-v-<away>`) and never from the date — so a fixture whose
kickoff moves keeps its id, its URL, and any ticket offers mapped to it. A
provider time always overrides a provisional one. Fixtures the provider
returns that the stored season does not contain are reported, never silently
appended, because that usually means a club id mapping is wrong.

## Validation

    npm run validate:pl

Checks the season as it sits in the running application: 20 clubs, 380
fixtures, 38 per club, 19 home / 19 away, no duplicate pairings or ids, 38
matchweeks of 10, every fixture dated, every club crested, the competition
logo resolving, and completed fixtures excluded from discovery while staying
in the database.
