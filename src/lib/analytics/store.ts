import type { AnalyticsEvent, AnalyticsEventType } from "./events";

/**
 * Where club interest is counted.
 *
 * The homepage must never score clubs from raw event rows, so this store
 * does not keep any. It aggregates on write into one counter per
 * (club, day, event type) — a few hundred numbers in total — which is the
 * precomputed table the ranking reads. Scoring is then a sum over at most
 * 135 clubs x 120 days, which is microseconds, and the ranking is cached on
 * top of that anyway (see club-popularity.ts).
 *
 * Swap the implementation for a real backend by assigning a different
 * instance in `setClubActivityStore` at startup; nothing above this file
 * knows how the counting is done.
 */
export interface ClubActivityStore {
  record(event: AnalyticsEvent): void;
  /**
   * Per-club event counts for the days in [from, to), keyed by club id.
   * `to` is exclusive so adjacent windows never double-count a day.
   */
  countsBetween(from: Date, to: Date): Map<string, ClubEventCounts>;
}

export type ClubEventCounts = Partial<Record<AnalyticsEventType, number>>;

/** Older days are dropped: nothing scores on them, so nothing stores them. */
export const RETENTION_DAYS = 150;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The default store: per-process, in memory.
 *
 * Honest about what that means — counters live in one server process, so
 * they reset on restart and are not shared between instances or regions.
 * That is the right trade for a deployment with no database: it is correct
 * and useful on a single instance, costs nothing, stores no personal data,
 * and the ranking degrades to the seeded fallback rather than to nonsense
 * when a fresh process has no history yet.
 *
 * For multi-instance production, implement ClubActivityStore against a
 * shared counter store (Redis `HINCRBY` per club/day, or a small table with
 * `INSERT ... ON CONFLICT DO UPDATE`) and register it at startup. The
 * interface is deliberately two methods wide so that is a short job.
 */
export class InMemoryClubActivityStore implements ClubActivityStore {
  /** club id -> day -> event type -> count */
  private readonly counters = new Map<string, Map<string, ClubEventCounts>>();
  private lastPrunedDay = "";

  record(event: AnalyticsEvent): void {
    const at = event.at ?? new Date();
    const day = dayKey(at);
    this.pruneOnceADay(at);

    // A fixture names two clubs and counts for both; de-duplicated so a
    // malformed payload cannot score the same club twice for one event.
    for (const clubId of new Set(event.clubIds)) {
      if (!clubId) continue;
      let days = this.counters.get(clubId);
      if (!days) {
        days = new Map();
        this.counters.set(clubId, days);
      }
      const counts = days.get(day) ?? {};
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      days.set(day, counts);
    }
  }

  countsBetween(from: Date, to: Date): Map<string, ClubEventCounts> {
    const fromKey = dayKey(from);
    const toKey = dayKey(to);
    const result = new Map<string, ClubEventCounts>();

    for (const [clubId, days] of this.counters) {
      const totals: ClubEventCounts = {};
      let any = false;
      for (const [day, counts] of days) {
        if (day < fromKey || day >= toKey) continue;
        for (const [type, n] of Object.entries(counts) as [AnalyticsEventType, number][]) {
          totals[type] = (totals[type] ?? 0) + n;
          any = true;
        }
      }
      if (any) result.set(clubId, totals);
    }

    return result;
  }

  /** Cheap: at most one sweep per calendar day, not per write. */
  private pruneOnceADay(now: Date): void {
    const today = dayKey(now);
    if (today === this.lastPrunedDay) return;
    this.lastPrunedDay = today;

    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
    const cutoffKey = dayKey(cutoff);

    for (const [clubId, days] of this.counters) {
      for (const day of days.keys()) {
        if (day < cutoffKey) days.delete(day);
      }
      if (days.size === 0) this.counters.delete(clubId);
    }
  }
}

/**
 * Survives the module reloads Next does in development, so counts built up
 * while clicking around are not wiped on every edit.
 */
const globalForStore = globalThis as unknown as {
  __seatigoClubActivityStore?: ClubActivityStore;
};

export function getClubActivityStore(): ClubActivityStore {
  globalForStore.__seatigoClubActivityStore ??= new InMemoryClubActivityStore();
  return globalForStore.__seatigoClubActivityStore;
}

/** Register a different backend at startup. */
export function setClubActivityStore(store: ClubActivityStore): void {
  globalForStore.__seatigoClubActivityStore = store;
}
