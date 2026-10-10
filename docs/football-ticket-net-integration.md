# Football Ticket Net integration

Seatigo's first non-demo ticket provider. Everything is built except the two
things only Football Ticket Net can supply: **their API documentation** and
**credentials**. Until both exist the provider is inert — it reports itself
disabled, the registry leaves it out, and it contributes no offers.

```bash
npm test     # 62 assertions covering matching, normalization, config and redirect safety
```

## What is deliberately not here

- **No scraping.** Nothing in this integration reads footballticketnet.com.
  The provider only ever calls the base URL in
  `FOOTBALL_TICKET_NET_API_BASE_URL`, and does nothing at all until that is
  set.
- **No demo prices.** Every other adapter under `providers/` generates
  plausible inventory so the comparison UI has something to show. This one
  must never do that: a generated price attributed to a named real company
  is a false statement about what that company charges. No credentials
  means no offers.
- **No invented endpoints.** Paths, field names, the auth scheme and the
  affiliate parameter are placeholders, each marked `TODO(ftn-api)`. They
  are structured guesses at a conventional marketplace API, written so that
  a wrong guess produces *no offers* rather than a wrong price.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `FOOTBALL_TICKET_NET_API_KEY` | Authenticates Seatigo's server to the API. Server-side only; never reaches the browser and never appears in an outbound URL. |
| `FOOTBALL_TICKET_NET_AFFILIATE_ID` | Attached to outbound links so clicks are credited. |
| `FOOTBALL_TICKET_NET_API_BASE_URL` | API root, supplied with the credentials. **Must be https** — credentials travel on it. |

All three are required together. `.env.example` lists them with empty
values; nothing secret is committed.

The provider is only consulted when `TICKETING_MODE=live`.

## Enabling and disabling

| Goal | Setting |
| --- | --- |
| Generated offers from four fake sellers (default) | `TICKETING_MODE=demo` |
| Real offers only | `TICKETING_MODE=live` + all three variables |
| Switch the provider off while keeping credentials | `active: false` in `footballTicketNetMeta` |

Demo and live never mix. In demo mode Football Ticket Net is excluded even
if credentials are present; in live mode the demo adapters are excluded
entirely. Mixing a generated price beside a real one would make the real
one untrustworthy.

A live deployment with nothing configured is a valid state: fixtures stay
discoverable and each shows "No offers available yet".

Check the current state without calling anyone:

```ts
import { describeProviders } from "@/lib/ticketing/registry";
describeProviders();
// [{ id: "football-ticket-net", kind: "live", active: true, enabled: false }, …]
```

## Where the official values must go

Every one is marked `TODO(ftn-api)` in the source.

| File | What needs the real value |
| --- | --- |
| `client.ts` | The search path (`/events`) and its query parameter names. |
| `client.ts` | The auth scheme — `Authorization: Bearer` is assumed; it may be `X-Api-Key` or a query parameter. |
| `client.ts` | The response envelope. `extractEvents` currently accepts a bare array or `{data|events|results: […]}`; narrow it once the real shape is known. |
| `client.ts` | `AFFILIATE_QUERY_PARAM` (`aff`). If the programme uses a path prefix or a signed token rather than a query parameter, replace the body of `buildAffiliateUrl`, not just the constant. |
| `types.ts` | Every field name on `FtnEvent` and `FtnListing`, and whether the date carries a timezone. |
| `mapper.ts` | `CATEGORY_PATTERNS` — their documented seat-category vocabulary. |
| `mapper.ts` | Whether the quoted price includes booking fees. `feesIncluded` is hard-coded `false` until documented, because claiming fees are included when they are not understates the real cost. |
| `provider.ts` | `getOfferDetails` — unimplemented until there is a documented single-listing endpoint. |
| `provider.ts` | `supportedCountries`, `supportedCurrencies` and `affiliateNetwork` — currently plausible defaults, not contractual facts. |

## How event matching works

Matching runs in **one direction only**: Seatigo asks "what does this seller
have for *this* fixture?". A provider event that matches nothing is
discarded. **A provider event can never create a Seatigo fixture** — the
fixture list belongs to the football data provider and to nothing else.

For an event to be accepted as a fixture (`mapper.ts`, `matchesFixture`):

1. **Both teams must resolve**, through the same curated alias registry the
   crests use (`CLUB_CRESTS`). Exact matches only — on the club's slug or a
   registered alias. "Man Utd", "PSG" and "Spurs" resolve; "Manchester"
   alone does not, because a fuzzy match here would attach real money to
   the wrong fixture.
2. **Home and away must be the right way round.** A reversed pairing is the
   other leg — a different fixture at a different ground on a different
   date.
3. **The date must agree within one day.** A 20:45 kickoff in Madrid is
   already the next day in several timezones a marketplace might publish
   in. The pairing has to agree as well, so this cannot collapse two
   different fixtures into one.
4. **Competition and venue/city are secondary.** They can veto a match the
   teams and date would otherwise allow, but their absence never blocks
   one. A venue only vetoes when the city disagrees too, so a sponsor-free
   venue name ("Arsenal Stadium" for the Emirates) does not cost a fixture
   its offers.

Each rejection returns a reason (`teams-do-not-match`, `date-too-far`,
`competition-mismatch`, …), which is what makes the behaviour testable.

## How offers are normalized

`toTicketOffer` is all-or-nothing. A listing is dropped unless it has a
positive finite price, a three-letter currency code, an **https**
destination and a category that maps to one of Seatigo's five tiers.

There is no partial offer. A price without a currency, or an unmappable
category, is not a cheaper offer — it is a broken one, and filling the gap
with a default would be inventing data about someone's money. Good listings
on the same event still come through; only the broken ones are dropped.

Offer ids are `football-ticket-net__<externalOfferId>`, matching the
identity rule in `lib/ticketing/identity.ts` that `/go` and deduplication
both rely on. When the provider supplies no listing id, a deterministic one
is derived so the same listing keeps the same id between refreshes.

## How affiliate tracking is attached

At **redirect time, on the server** — never baked into the offer object,
which is serialized to the browser.

```
"View deal"  →  /go/<offerId>
                  ├── resolve the offer
                  ├── reject anything that is not https
                  ├── adapter.decorateOutboundUrl(deeplink)   ← affiliate id added here
                  ├── record the outbound click (no personal data)
                  └── 302 to the seller
```

`decorateOutboundUrl` is an optional method on `TicketProviderAdapter`, so
any future provider can attach its own tracking the same way. Returning
`null` refuses the redirect and the visitor stays inside Seatigo — better
than sending them somewhere the seller will not credit.

The API key is never part of an outbound URL; there is a test asserting it.

## Failure behaviour

Every failure mode produces the same result — no offers from this seller,
and a page that still renders:

| Situation | Result |
| --- | --- |
| Any variable missing or blank | Disabled; logged once at startup; no request made |
| Base URL not https or unparseable | Disabled; config reports the exact problem |
| Non-2xx response | No offers; logged once per status code |
| Timeout (6s) or network error | No offers |
| Unparseable JSON | No offers |
| Unrecognised response envelope | No offers |
| Events returned, none matching the fixture | No offers |
| Listings present but malformed | Only the sound ones become offers |

Warnings are logged once per process, so an unconfigured deployment says so
in the boot logs without flooding them on every fixture page.

## Tests

`src/lib/ticketing/providers/football-ticket-net/*.test.ts` and
`src/lib/ticketing/registry.test.ts`, run with `npm test` (Node's built-in
runner through `tsx` — no new dependency).

Covered: alias and diacritic team resolution; reversed pairings; date
tolerance and its limit; competition and venue vetoes; category mapping and
refusal to guess; every rejected-listing case; configuration validation
including whitespace-only values and non-https base URLs; missing
credentials making no network call; demo/live separation in the registry;
and redirect safety — `http:`, `javascript:`, `data:`, protocol-relative
and relative URLs are all refused, existing query parameters are preserved,
a stale affiliate parameter is overwritten rather than duplicated, and the
API key never appears in an outbound URL.
