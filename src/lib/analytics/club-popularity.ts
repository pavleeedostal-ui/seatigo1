import type { Club } from "@/types/football";
import { getFootballDataProvider } from "@/lib/football";
import type { AnalyticsEvent, AnalyticsEventType } from "./events";
import { getClubActivityStore, type ClubEventCounts } from "./store";

/**
 * How "popular" a club is **on Seatigo** — which is not the same question as
 * how big it is in the world. Everything that decides the homepage's Popular
 * Clubs order lives in this file so the answer can be tuned in one place.
 */

/**
 * Points per event. Weighted by how much intent each one shows: reading a
 * club's page is mild interest, clicking through to a seller is someone who
 * is close to buying a ticket.
 *
 * A starting point, meant to be adjusted once there is real traffic to
 * calibrate against.
 */
export const EVENT_WEIGHTS: Record<AnalyticsEventType, number> = {
  club_page_view: 1,
  club_search: 2,
  match_view: 2,
  compare_tickets_click: 3,
  seller_outbound_click: 5,
};

/** The window that decides the ranking. */
export const RECENT_WINDOW_DAYS = 30;
/** The window immediately before it, used only to steady the order. */
export const BASELINE_WINDOW_DAYS = 90;
/**
 * Recent interest dominates, but not completely: a club that has been
 * steadily popular for a quarter should not drop off the homepage because
 * of one quiet month, and a single viral fixture should not own the
 * section. The two windows are compared as daily rates, so the longer one
 * is not favoured simply for being longer.
 */
export const RECENT_WEIGHT = 0.7;
export const BASELINE_WEIGHT = 1 - RECENT_WEIGHT;

/**
 * Below this much real activity the ranking would be noise — a handful of
 * clicks would decide the homepage. Until Seatigo passes it, the section
 * shows the seeded list instead and says so.
 */
export const MIN_EVENTS_FOR_RANKING = 200;

/**
 * The seed used until there is enough traffic.
 *
 * This is an editorial list of globally high-interest clubs from the
 * supported competitions, not a measurement, and it is reported as
 * `source: "seed"` so the UI never presents it as data-driven. It is
 * replaced automatically — not manually — the moment real activity passes
 * MIN_EVENTS_FOR_RANKING.
 */
export const FALLBACK_CLUB_SLUGS: readonly string[] = [
  "real-madrid",
  "barcelona",
  "manchester-united",
  "liverpool",
  "arsenal",
  "manchester-city",
  "chelsea",
  "bayern-munich",
  "paris-saint-germain",
  "juventus",
  "ac-milan",
  "inter-milan",
];

/** How long a computed ranking is reused before it is worked out again. */
export const RANKING_CACHE_TTL_MS = 5 * 60 * 1000;

export type PopularitySource = "traffic" | "seed";

export interface PopularClub {
  club: Club;
  /**
   * Internal only — the spec is explicit that users never see a score. It is
   * returned so the ranking can be inspected and tuned, and the UI ignores it.
   */
  score: number;
}

export interface PopularClubsResult {
  clubs: PopularClub[];
  /** "traffic" once there is enough real activity; "seed" until then. */
  source: PopularitySource;
  /** Events counted across both windows, for diagnostics. */
  eventsConsidered: number;
}

function daysAgo(days: number, now: Date): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function weightedPoints(counts: ClubEventCounts): number {
  let total = 0;
  for (const [type, n] of Object.entries(counts) as [AnalyticsEventType, number][]) {
    total += (EVENT_WEIGHTS[type] ?? 0) * n;
  }
  return total;
}

function eventCount(counts: ClubEventCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
}

/**
 * Blended daily rate: recent points per day, steadied by the preceding
 * window's points per day. Dividing by the window length is what makes the
 * two comparable — without it the 90-day window would always dominate.
 */
export function scoreFor(recent: ClubEventCounts, baseline: ClubEventCounts): number {
  const recentRate = weightedPoints(recent) / RECENT_WINDOW_DAYS;
  const baselineRate = weightedPoints(baseline) / BASELINE_WINDOW_DAYS;
  return RECENT_WEIGHT * recentRate + BASELINE_WEIGHT * baselineRate;
}

/**
 * Ranks clubs by measured interest, falling back to the seed when there is
 * not enough of it.
 *
 * Reads only the aggregated counters, never raw events, and the result is
 * cached — see `getPopularClubs`, which is what pages should call.
 */
export async function computePopularClubs(
  limit: number,
  now = new Date(),
): Promise<PopularClubsResult> {
  const store = getClubActivityStore();

  const recentFrom = daysAgo(RECENT_WINDOW_DAYS, now);
  const baselineFrom = daysAgo(RECENT_WINDOW_DAYS + BASELINE_WINDOW_DAYS, now);

  // Exclusive upper bounds, so a day is never counted in both windows.
  const recent = store.countsBetween(recentFrom, daysAgo(-1, now));
  const baseline = store.countsBetween(baselineFrom, recentFrom);

  let eventsConsidered = 0;
  for (const counts of recent.values()) eventsConsidered += eventCount(counts);
  for (const counts of baseline.values()) eventsConsidered += eventCount(counts);

  const provider = getFootballDataProvider();
  const clubs = await provider.getClubs();
  const byId = new Map(clubs.map((c) => [c.id, c]));

  const scored: PopularClub[] = [];
  for (const id of new Set([...recent.keys(), ...baseline.keys()])) {
    const club = byId.get(id);
    // A counter for a club that is no longer in the database is ignored
    // rather than dropped, so it comes back if the club does.
    if (!club) continue;
    const score = scoreFor(recent.get(id) ?? {}, baseline.get(id) ?? {});
    if (score > 0) scored.push({ club, score });
  }

  const enough = eventsConsidered >= MIN_EVENTS_FOR_RANKING && scored.length >= limit;
  if (!enough) {
    return {
      clubs: seedClubs(clubs, limit),
      source: "seed",
      eventsConsidered,
    };
  }

  scored.sort((a, b) => b.score - a.score || a.club.name.localeCompare(b.club.name));
  return { clubs: scored.slice(0, limit), source: "traffic", eventsConsidered };
}

/**
 * The seeded list, in its declared order. Any slug that is not in the club
 * database is skipped rather than faked, and the list is topped up from the
 * database only if that leaves it short.
 */
function seedClubs(clubs: Club[], limit: number): PopularClub[] {
  const bySlug = new Map(clubs.map((c) => [c.slug, c]));
  const picked: PopularClub[] = [];

  for (const slug of FALLBACK_CLUB_SLUGS) {
    const club = bySlug.get(slug);
    if (club) picked.push({ club, score: 0 });
    if (picked.length === limit) break;
  }

  if (picked.length < limit) {
    const taken = new Set(picked.map((p) => p.club.id));
    for (const club of clubs) {
      if (taken.has(club.id)) continue;
      picked.push({ club, score: 0 });
      if (picked.length === limit) break;
    }
  }

  return picked;
}

/**
 * Cached entry point. The homepage calls this, so a burst of requests scores
 * the counters once rather than once each.
 */
const globalForCache = globalThis as unknown as {
  __seatigoPopularClubs?: { at: number; limit: number; value: PopularClubsResult };
};

export async function getPopularClubs(limit = 8): Promise<PopularClubsResult> {
  const cached = globalForCache.__seatigoPopularClubs;
  if (cached && cached.limit === limit && Date.now() - cached.at < RANKING_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = await computePopularClubs(limit);
  globalForCache.__seatigoPopularClubs = { at: Date.now(), limit, value };
  return value;
}

/** Drops the cached ranking, so the next read recomputes. Used by tests. */
export function invalidatePopularClubs(): void {
  globalForCache.__seatigoPopularClubs = undefined;
}

/**
 * Records interest in one or more clubs.
 *
 * Every call site goes through here rather than touching the store, so the
 * rule that counting is keyed by club id — never by name, slug or alias —
 * holds in one place.
 */
export function recordClubInterest(event: AnalyticsEvent): void {
  if (event.clubIds.length === 0) return;
  getClubActivityStore().record(event);
}
