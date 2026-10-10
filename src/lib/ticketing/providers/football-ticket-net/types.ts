/**
 * Football Ticket Net — wire types and configuration.
 *
 * ## Read this before changing anything here
 *
 * Seatigo has **not** been given Football Ticket Net's API documentation.
 * Nothing in this file has been verified against a real response. The
 * shapes below are a deliberately defensive guess at a conventional
 * secondary-marketplace payload, written so that:
 *
 *   - every field is optional and `unknown`-tolerant, because a field that
 *     turns out to be named differently must produce "no offers", never a
 *     crash or a wrong price;
 *   - the mapper validates each field at runtime rather than trusting the
 *     type, so the compiler's opinion cannot become a production bug.
 *
 * When the official documentation arrives, every `TODO(ftn-api)` marker in
 * this directory is a place where a real value has to replace a guess. Do
 * not delete a marker without checking it against the docs.
 *
 * Nothing here scrapes footballticketnet.com. The provider only ever talks
 * to the base URL configured in `FOOTBALL_TICKET_NET_API_BASE_URL`, and
 * stays switched off until that is set.
 */

/** Resolved, validated configuration. Only ever built on the server. */
export interface FootballTicketNetConfig {
  apiKey: string;
  affiliateId: string;
  /** Always https, no trailing slash. */
  baseUrl: string;
}

export type ConfigProblem =
  | "missing-api-key"
  | "missing-affiliate-id"
  | "missing-base-url"
  | "base-url-not-a-url"
  | "base-url-not-https";

export type ConfigResult =
  | { ok: true; config: FootballTicketNetConfig }
  | { ok: false; problems: ConfigProblem[] };

/**
 * One event (a fixture) as the provider describes it.
 *
 * TODO(ftn-api): confirm every field name, and whether the date is an ISO
 * instant, a local date-time without a zone, or a display string. The
 * mapper currently accepts an ISO date or date-time and rejects anything
 * else; see `parseEventDate`.
 */
export interface FtnEvent {
  id?: unknown;
  homeTeam?: unknown;
  awayTeam?: unknown;
  /** TODO(ftn-api): confirm the field name and whether it carries a timezone. */
  date?: unknown;
  competition?: unknown;
  venue?: unknown;
  city?: unknown;
  country?: unknown;
  /** TODO(ftn-api): confirm whether listings are embedded or fetched separately. */
  listings?: unknown;
}

/**
 * One ticket listing within an event.
 *
 * TODO(ftn-api): confirm field names, whether `price` is per ticket or per
 * order, whether it includes fees, and the currency representation
 * (ISO 4217 code vs symbol).
 */
export interface FtnListing {
  id?: unknown;
  category?: unknown;
  section?: unknown;
  price?: unknown;
  currency?: unknown;
  quantity?: unknown;
  url?: unknown;
  updatedAt?: unknown;
}

/** Everything the provider is asked for, so the client has one shape to build. */
export interface FtnEventQuery {
  homeTeam: string;
  awayTeam: string;
  /** ISO date (YYYY-MM-DD) of the fixture as Seatigo holds it. */
  date: string | null;
}
