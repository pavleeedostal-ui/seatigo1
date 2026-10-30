# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

European football fans, often travelling to another country for a match, who
are looking for a specific fixture or club and want to compare ticket offers
before buying. They use Seatigo on a phone (planning on the move, frequently
in a second language) and on desktop (comparing carefully before committing
money).

## Product Purpose

Seatigo is a football ticket comparison and discovery platform — "Skyscanner
for football tickets". It finds upcoming fixtures, compares ticket offers
from external sellers, and sends the visitor to the seller they choose.
Success is a visitor who quickly finds their match, understands which
sellers have offers at what price, and leaves for a seller with confidence.

Model: Search → Compare → Choose → External seller.

## Positioning

Seatigo never sells tickets. It is a neutral index over real fixture data
(UEFA and league sources) and real seller offers, with every outbound click
going through Seatigo's `/go/[offerId]` redirect so affiliate tracking is
attached server-side.

## Capabilities and Constraints

- Next.js App Router, Tailwind CSS v4, next-intl with six locales: EN, CS,
  DE, ES, IT, FR. Key parity is strict.
- Fixtures: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Czech
  league, UEFA Champions League and Europa League 2026/27 (league phase
  imported; knockout rounds show dates only until drawn).
- Ticket providers sit behind a `TicketProviderAdapter` interface. Demo mode
  generates clearly fake sellers; live mode uses real providers only
  (Football Ticket Net is the first, inert until credentialed). Demo and
  live never mix.
- Fixtures stay discoverable even when no seller has offers.
- Club pages, A–Z club directory with search, competition directory and
  stage/matchday navigation, search autocomplete.

## Brand Commitments

- Name: Seatigo. Slogan: "Find your Seat".
- Authentic club crests and official competition logos only; never imitate
  the UEFA logo.

## Evidence on Hand

- Real fixture data for the 2026/27 season.
- Club crests and competition logos under `public/`.
- No testimonials, reviews, user counts, press, or partner claims exist.
  None may be fabricated. Production must never show invented prices,
  inventory or sellers.

## Product Principles

1. Truth over persuasion: every price, seller and fixture shown is real or
   clearly labelled demo.
2. The fixture comes first; offers are attached to it, never the reverse.
3. Where the visitor is going next — which seller, what price — is always
   explicit before they leave.
4. Works in six languages and on a phone without compromise.

## Accessibility & Inclusion

WCAG AA minimum; keyboard-operable search and comparison; long translations
(German, French) must not clip or overflow.
