# Popular Clubs — how the ranking works

The homepage's Popular Clubs section is ordered by **what people actually do
on Seatigo**, not by how big a club is in the world. Everything that decides
the order lives in `src/lib/analytics/club-popularity.ts`.

## The pieces

| File | Role |
| --- | --- |
| `src/lib/analytics/events.ts` | The five event types and their shape |
| `src/lib/analytics/store.ts` | `ClubActivityStore` + the in-memory default |
| `src/lib/analytics/club-popularity.ts` | Weights, windows, scoring, fallback, cache |
| `src/lib/football/clubLookup.ts` | Query → one club, via the alias registry |
| `src/app/api/analytics/event/route.ts` | Beacon endpoint for the CTA click |
| `src/components/analytics/CtaTracker.tsx` | One delegated click listener |

## Events

| Event | Points | Where it is recorded |
| --- | --- | --- |
| `club_page_view` | 1 | `/[locale]/clubs/[slug]` render |
| `club_search` | 2 | `/[locale]/matches` render, when `q` resolves to a club |
| `match_view` | 2 | `/[locale]/matches/[slug]` render — credits both clubs |
| `compare_tickets_click` | 3 | Beacon from the ticket CTA |
| `seller_outbound_click` | 5 | `/go/[offerId]` redirect — credits both clubs |

Four of the five are recorded server-side while the page renders, so they
need no client JavaScript and cannot be blocked. Only the CTA click needs a
beacon, because it happens before any navigation the app sees.

The weights are a **starting point**. They encode intent rather than volume:
someone leaving for a seller is worth five page views. Change them in one
place — `EVENT_WEIGHTS` — and the whole system follows.

## What is stored

Nothing about the visitor. An event carries the event type, the club id(s),
optionally a fixture id, and a timestamp. No IP, no cookie, no user agent,
no referrer, no session id. There is nothing to anonymise because nothing
identifying is collected.

The store does not keep raw events either. It aggregates on write into one
counter per **(club, day, event type)** — a few hundred numbers — which is
the precomputed table the ranking reads. Counters older than
`RETENTION_DAYS` (150) are dropped.

## Scoring

```
recentRate   = weighted points in the last 30 days      / 30
baselineRate = weighted points in the 90 days before it / 90
score        = 0.7 x recentRate + 0.3 x baselineRate
```

Two windows, compared as **daily rates**. Dividing by the window length is
what makes them comparable — without it the 90-day window would always
dominate simply for being longer. The split keeps the section responsive to
current interest without letting one viral fixture own it, and stops a club
that has been steadily popular all quarter from vanishing after one quiet
month.

The windows do not overlap: the baseline is days 31–120, so no day is
counted twice.

## One club, one id

Counting is keyed by Seatigo's internal club id (`c-manutd`) at every step —
never by name, slug or search alias. Searches go through
`resolveClubByQuery`, which resolves against the same curated alias registry
the crests use, so "man utd", "Manchester United" and "manchester-united"
all credit one club rather than splitting its traffic three ways.

`resolveClubByQuery` matches **exactly** on name, short name, slug or a
registered alias. A query that merely contains a club's name ("arsenal
tickets london") is not counted, because a loose match would let one popular
substring inflate an unrelated club.

## Fallback

When there is not yet enough real activity —
`eventsConsidered < MIN_EVENTS_FOR_RANKING` (200), or fewer clubs have
activity than the section needs — the section shows `FALLBACK_CLUB_SLUGS`
instead and reports `source: "seed"`.

That list is **editorial, not measured**, and the UI says so: the seeded
state keeps the generic subtitle and shows no "Popular" markers, while the
measured state switches to "The clubs fans are searching for most on Seatigo
right now" and marks the top three. A seeded list is never presented as
data-driven.

The switch is automatic. Nothing has to be flipped when traffic arrives.

## Performance

The homepage never scores on a request:

1. Counters are aggregated on write, so there are no rows to scan.
2. `getPopularClubs` caches the computed ranking for
   `RANKING_CACHE_TTL_MS` (5 minutes).
3. The homepage is ISR with `revalidate = 300`, so the HTML itself is served
   from cache and rebuilt in the background.

A cold score is a sum over at most ~135 clubs x 120 days.

## Inspecting it

In development only:

```bash
curl -s localhost:3000/api/analytics/club-popularity | python3 -m json.tool
```

Returns the current source, event count, windows, weights and the scored
ranking — bypassing the cache. It 404s in production: the order is public,
the scores behind it are not.

## Production storage

The default `InMemoryClubActivityStore` is per-process. Counters reset on
restart and are not shared between instances or regions. That is correct and
useful on a single instance, costs nothing and stores no personal data — and
when a fresh process has no history, the ranking degrades to the seeded list
rather than to nonsense.

For multi-instance production, implement `ClubActivityStore` against a
shared counter store and register it at startup:

```ts
setClubActivityStore(new RedisClubActivityStore(redis));
```

The interface is two methods wide: `record(event)` and
`countsBetween(from, to)`. Redis `HINCRBY` on a `club:day` hash, or a small
table with `INSERT ... ON CONFLICT DO UPDATE`, both fit directly.
