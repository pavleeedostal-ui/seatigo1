import type { Match } from "@/types/football";
import type { SeatCategoryKey, TicketOffer } from "@/types/ticketing";
import { CLUB_CRESTS } from "@/lib/football/club-logos";
import { normalizeText } from "@/lib/text";
import { FOOTBALL_TICKET_NET_PROVIDER_ID } from "./client";
import type { FtnEvent, FtnListing } from "./types";

/**
 * Football Ticket Net — turning their events and listings into Seatigo's.
 *
 * Two jobs, both deliberately suspicious of their input:
 *
 *  1. **Matching.** Decide whether one of the provider's events is the
 *     fixture Seatigo asked about. This only ever runs in that direction.
 *     A provider event that matches nothing is discarded; it never creates
 *     a fixture. Seatigo's fixture list comes from the football data
 *     provider and from nowhere else.
 *
 *  2. **Normalizing.** Turn a listing into a `TicketOffer`, or reject it.
 *     A listing missing a price, a currency or a destination is not a
 *     cheaper offer — it is a broken one, and showing it would be worse
 *     than showing nothing.
 */

/** Club aliases, so "Man Utd" and "Manchester United FC" resolve alike. */
const aliasIndex = buildAliasIndex();

function buildAliasIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of CLUB_CRESTS) {
    index.set(normalizeText(entry.slug), entry.slug);
    for (const alias of entry.aliases) index.set(normalizeText(alias), entry.slug);
  }
  return index;
}

/**
 * The Seatigo club slug a provider's team name refers to, or null.
 *
 * Exact matches only, against the club's own slug or a curated alias. A
 * fuzzy match here would attach real money to the wrong fixture, so an
 * unrecognised name is an unrecognised name.
 */
export function resolveTeamSlug(name: unknown, fixtureSlugs?: string[]): string | null {
  if (typeof name !== "string") return null;
  const key = normalizeText(name);
  if (!key) return null;

  const direct = aliasIndex.get(key);
  if (direct) return direct;

  // Last resort, and only against the two clubs actually in play: the
  // provider may append a qualifier ("Arsenal FC Women", "Real Madrid CF").
  // Restricting it to the fixture's own clubs means this can confirm a
  // match but can never invent one.
  if (fixtureSlugs) {
    for (const slug of fixtureSlugs) {
      const slugKey = normalizeText(slug);
      if (key === slugKey) return slug;
    }
  }

  return null;
}

/**
 * The calendar date of a provider event, as YYYY-MM-DD, or null.
 *
 * TODO(ftn-api): confirm whether their date carries a timezone. A bare
 * date-time is read as UTC here, which is why the comparison below allows
 * a day either side.
 */
export function parseEventDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(trimmed);
  if (dateOnly) return dateOnly[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

/** Whole days between two ISO dates. */
function dayGap(a: string, b: string): number {
  const left = Date.parse(`${a}T00:00:00Z`);
  const right = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(left) || Number.isNaN(right)) return Number.POSITIVE_INFINITY;
  return Math.abs(left - right) / 86_400_000;
}

/**
 * A day either side is accepted. A 20:45 kickoff in Madrid is already the
 * next day in several of the timezones a marketplace might publish in, and
 * the team pairing has to agree as well, so this cannot collapse two
 * different fixtures into one.
 */
const DATE_TOLERANCE_DAYS = 1;

export type MatchRejection =
  | "home-team-unresolved"
  | "away-team-unresolved"
  | "teams-do-not-match"
  | "date-missing"
  | "date-too-far"
  | "competition-mismatch"
  | "location-mismatch";

export interface MatchDecision {
  matched: boolean;
  reason?: MatchRejection;
}

/**
 * Whether a provider event is the given Seatigo fixture.
 *
 * Teams and date are required to agree. Competition and venue/city are
 * *secondary*: they can veto a match that the teams and date would
 * otherwise allow, but their absence never blocks one, because a
 * marketplace naming a competition differently is normal and naming it
 * contradictorily is not.
 */
export function matchesFixture(event: FtnEvent, fixture: Match): MatchDecision {
  const fixtureSlugs = [fixture.homeTeam.slug, fixture.awayTeam.slug];

  const home = resolveTeamSlug(event.homeTeam, fixtureSlugs);
  if (!home) return { matched: false, reason: "home-team-unresolved" };

  const away = resolveTeamSlug(event.awayTeam, fixtureSlugs);
  if (!away) return { matched: false, reason: "away-team-unresolved" };

  // Order matters. A reversed pairing is the other leg, at the other
  // ground, on another date — a different fixture entirely.
  if (home !== fixture.homeTeam.slug || away !== fixture.awayTeam.slug) {
    return { matched: false, reason: "teams-do-not-match" };
  }

  const eventDate = parseEventDate(event.date);
  const fixtureDate = fixture.date;
  if (!eventDate || !fixtureDate) return { matched: false, reason: "date-missing" };
  if (dayGap(eventDate, fixtureDate) > DATE_TOLERANCE_DAYS) {
    return { matched: false, reason: "date-too-far" };
  }

  if (contradicts(event.competition, [fixture.competition.name, fixture.competition.shortName])) {
    return { matched: false, reason: "competition-mismatch" };
  }

  const places = [fixture.stadium?.name, fixture.city, fixture.country].filter(
    (value): value is string => Boolean(value),
  );
  if (places.length > 0) {
    const venueContradicts = contradicts(event.venue, places);
    const cityContradicts = contradicts(event.city, places);
    // Only reject when *both* stated places disagree. A marketplace that
    // lists a sponsor-free venue name should not cost a fixture its offers.
    if (venueContradicts && cityContradicts) {
      return { matched: false, reason: "location-mismatch" };
    }
  }

  return { matched: true };
}

/**
 * True when the provider states a value and none of ours relates to it.
 * A missing or unreadable value never contradicts anything.
 */
function contradicts(value: unknown, ours: string[]): boolean {
  if (typeof value !== "string") return false;
  const theirs = normalizeText(value);
  if (!theirs) return false;

  return !ours.some((candidate) => {
    const mine = normalizeText(candidate);
    if (!mine) return false;
    return mine === theirs || mine.includes(theirs) || theirs.includes(mine);
  });
}

/** The first event that is this fixture, or null. */
export function selectEventForFixture(
  events: FtnEvent[],
  fixture: Match,
): FtnEvent | null {
  for (const event of events) {
    if (matchesFixture(event, fixture).matched) return event;
  }
  return null;
}

/**
 * Provider category/section text to one of Seatigo's five tiers.
 *
 * TODO(ftn-api): replace with their documented category vocabulary. Until
 * then an unrecognised category is **not** guessed — the listing is
 * dropped by `toTicketOffer`, because putting a hospitality seat in the
 * "behind goal" filter is worse than not listing it.
 */
const CATEGORY_PATTERNS: [SeatCategoryKey, RegExp][] = [
  ["hospitality", /hospitality|vip|lounge|box|suite|executive/],
  ["premium", /premium|club|platinum|business|prime/],
  ["longside", /longside|long side|lateral|sideline|main stand|west|east/],
  ["shortside", /shortside|short side|corner|end stand/],
  ["behind_goal", /behind goal|behind the goal|goal end|curva|tribune nord|north|south/],
];

export function mapSeatCategory(...values: unknown[]): SeatCategoryKey | null {
  const text = values
    .filter((value): value is string => typeof value === "string")
    .map(normalizeText)
    .join(" ");
  if (!text) return null;

  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function finitePositive(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** ISO 4217, as the rest of Seatigo stores currency. */
function currencyCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isoTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  // The provider did not say when this was priced, so the honest answer is
  // "as of now" — the moment Seatigo read it.
  return new Date().toISOString();
}

/**
 * One listing as a Seatigo offer, or null if it cannot be trusted whole.
 *
 * Deliberately all-or-nothing. There is no partial offer: a price without
 * a currency, or a destination that is not https, makes the whole listing
 * unusable, and substituting a default would be inventing data about
 * someone's money.
 */
export function toTicketOffer(
  listing: FtnListing,
  context: { fixture: Match; externalEventId: string },
): TicketOffer | null {
  if (!listing || typeof listing !== "object") return null;

  const price = finitePositive(listing.price);
  if (price === null) return null;

  const currency = currencyCode(listing.currency);
  if (currency === null) return null;

  const deeplink = httpsUrl(listing.url);
  if (deeplink === null) return null;

  const category = mapSeatCategory(listing.category, listing.section);
  if (category === null) return null;

  const quantity = finitePositive(listing.quantity);
  const externalOfferId =
    typeof listing.id === "string" && listing.id.trim()
      ? listing.id.trim()
      : // No listing id: derive one that is stable for the same listing, so
        // the /go route can resolve it and deduplication still works.
        `${context.externalEventId}-${category}-${price}-${currency}`;

  return {
    id: `${FOOTBALL_TICKET_NET_PROVIDER_ID}__${externalOfferId}`,
    fixtureId: context.fixture.id,
    providerId: FOOTBALL_TICKET_NET_PROVIDER_ID,
    externalOfferId,
    category,
    section: typeof listing.section === "string" ? listing.section : "",
    quantityAvailable: quantity === null ? 1 : Math.floor(quantity),
    price,
    currency,
    // TODO(ftn-api): confirm whether the quoted price includes booking fees.
    // Left false until documented: claiming fees are included when they are
    // not would understate the real cost.
    feesIncluded: false,
    deeplink,
    lastUpdated: isoTimestamp(listing.updatedAt),
  };
}

/** Pulls a listing array off an event, tolerating a missing field. */
export function extractListings(event: FtnEvent): FtnListing[] {
  return Array.isArray(event.listings) ? (event.listings as FtnListing[]) : [];
}

/** The provider's own id for an event, as a string, or null. */
export function eventId(event: FtnEvent): string | null {
  if (typeof event.id === "string" && event.id.trim()) return event.id.trim();
  if (typeof event.id === "number" && Number.isFinite(event.id)) return String(event.id);
  return null;
}

/** Every usable offer on an event, for a fixture already matched to it. */
export function toTicketOffers(event: FtnEvent, fixture: Match): TicketOffer[] {
  const externalEventId = eventId(event);
  if (!externalEventId) return [];

  return extractListings(event)
    .map((listing) => toTicketOffer(listing, { fixture, externalEventId }))
    .filter((offer): offer is TicketOffer => offer !== null);
}
