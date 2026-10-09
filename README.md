# Seatigo — Find your Seat

A football ticket **comparison** platform (metasearch, like Skyscanner for tickets) across Europe's biggest leagues and cups. Seatigo never sells tickets or takes payment — it compares offers from third-party sellers and sends the user to the seller's own site to complete the purchase. Built with Next.js (App Router), TypeScript, Tailwind CSS and next-intl.

**Flow:** Search → Compare → Redirect. `/matches` finds fixtures, a match's detail page compares live ticket offers from every connected seller, and clicking "View deal" goes through `/go/[offerId]` (which logs the outbound click) before redirecting off-site.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root path redirects to your browser's preferred supported locale (falling back to English).

## Football data (fixtures only)

The app reads fixtures, competitions, clubs and stadiums through a single interface at [`src/lib/football/types.ts`](src/lib/football/types.ts) (`FootballDataProvider`). This layer never carries pricing or availability — that's a ticketing concern, kept strictly separate (see below).

- **Mock provider** (default): realistic bundled fixtures in [`src/lib/football/mockData.ts`](src/lib/football/mockData.ts). Dates are generated relative to today, so the app always shows upcoming matches.
- **football-data.org provider**: a real integration in [`src/lib/football/footballDataProvider.ts`](src/lib/football/footballDataProvider.ts).

Switch via `.env.local` (copy `.env.example`):

```bash
FOOTBALL_DATA_PROVIDER=football-data
FOOTBALL_DATA_API_KEY=your-key-from-football-data.org
```

## Ticketing (offers, providers, redirects)

Everything about comparing and linking to ticket sellers lives under [`src/lib/ticketing/`](src/lib/ticketing):

- **`types.ts`** — the `TicketProviderAdapter` interface every seller integration implements: `searchOffers(fixture)` and `getOfferDetails(externalOfferId)`. The frontend only ever sees the normalized `TicketOffer` shape from `src/types/ticketing.ts`, never a provider-specific one.
- **`providers/`** — one file per seller (`demo.ts`, `provider-a.ts`, `provider-b.ts`, `provider-c.ts`). All four currently generate realistic demo offers (see `demoOfferGenerator.ts`) with different pricing bias, fee policy and category coverage so the comparison UI has real multi-seller variety to show; `provider-c` (StadiumHub) is flagged as a sponsored placement, always rendered with a visible "Sponsored" tag. Swap a provider's body for real HTTP calls to go live — nothing else changes.
- **`registry.ts`** — which providers are active. `TICKETING_MODE=live` turns off every demo adapter, so a market with no real seller connected correctly shows "Ticket offers coming soon" instead of demo prices.
- **`aggregator.ts`** — `getOffersForFixture(fixture)` calls every active provider, normalizes and de-duplicates their offers, and returns them sorted with the lowest price and seller count precomputed. `getCheapestOffersForFixtures(fixtures)` is the batch version used by list/home pages. Nothing above this layer talks to a provider directly.
- **`sort.ts`** — pure offer sorting (recommended / lowest / highest / best seats), shared by the server aggregator and the client-side comparison UI.
- **`fixtureMapping.ts`** — the extension point for resolving Seatigo's internal fixture id to a real provider's own event id once real sellers are connected.
- **`analytics.ts`** — `recordOutboundClick(...)`, called from the `/go/[offerId]` redirect route ([`src/app/go/[offerId]/route.ts`](src/app/go/[offerId]/route.ts)) before redirecting off-site. No cookies, no personal data — just enough to build popular-match/provider/CTR reporting later.

## Search & results UX

Modeled on flight-metasearch UX (Skyscanner-style), not its visuals: a dominant hero search (team/city/competition + date + tickets), a search-results list with a "search summary + Edit search" bar, sticky sort/filter toolbar, and row-based results with price as the most prominent element — carried straight into a per-match offer comparison.

- **`src/lib/matchesUrl.ts`** — `MatchesSearchState` is the single shape for everything in the `/matches` querystring (search terms, filters, sort). `buildMatchesQuery(state)` is the one place that turns it into a URL, used by the search bar, the search-summary "Edit search" form, the filters panel, and the sort select, so they never fall out of sync.
- **`components/matches/SearchSummaryBar.tsx`** — shows the active search ("Arsenal" · 18 Oct · 2 tickets) with an inline "Edit search" form, and **`MatchSortSelect.tsx`** provides Recommended / Lowest price / Best seats sorting — both sit in a `sticky` toolbar under the header.
- Ticket quantity flows end to end: picked in the hero search, shown in the results summary, used to filter out matches that can't fit the group (`CheapestOfferSummary.maxQuantityAvailable`), and carried into the match page as `?tickets=`, where it pre-selects the quantity filter in the offer comparison.
- Category and seller are filterable both on the results list (via each fixture's offer facets, `CheapestOfferSummary.categories` / `providerIds`) and again on the match detail's offer comparison — same filter vocabulary, two altitudes.

## Internationalization

Powered by [next-intl](https://next-intl.dev). Supported locales: `en`, `cs`, `de`, `es`, `it`, `fr` (see [`src/i18n/routing.ts`](src/i18n/routing.ts)). Translation files live in [`messages/`](messages) — one JSON file per locale, always kept in sync key-for-key. The brand name "Seatigo" and the slogan "Find your Seat" are intentionally left untranslated everywhere.

## Project structure

```
src/
  app/[locale]/        routes (App Router, one locale segment above everything)
  app/go/[offerId]/    outbound redirect route (click tracking + provider deeplink)
  components/ui/       shadcn-style primitives (button, card, dialog, sheet, ...)
  components/layout/   header, footer, nav, language switcher
  components/home/     homepage sections
  components/matches/  search, filters, match cards
  components/stadium/  SVG stadium map (used as a category filter)
  components/offers/   ticket comparison UI (rows, filters, sort, disclaimer)
  lib/football/        fixture provider interface, mock data, football-data.org client
  lib/ticketing/        provider adapters, aggregator, sorting, redirect analytics
  lib/matchesUrl.ts     shared /matches search+filter+sort URL state
  i18n/                next-intl routing/navigation config
  types/                shared domain types (football fixtures, ticketing)
messages/              translation files, one per locale
```
