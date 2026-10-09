import { NextResponse } from "next/server";
import {
  computePopularClubs,
  EVENT_WEIGHTS,
  MIN_EVENTS_FOR_RANKING,
  RECENT_WINDOW_DAYS,
  BASELINE_WINDOW_DAYS,
  RECENT_WEIGHT,
} from "@/lib/analytics/club-popularity";

/**
 * Shows what the ranking currently thinks, bypassing the cache the homepage
 * reads through.
 *
 * Not available in production: the order is public on the homepage, but the
 * scores behind it are internal and the spec is explicit that users never
 * see them. This exists so the weighting can be checked against real
 * traffic while tuning it.
 *
 * It exposes no personal data because none is collected — only per-club
 * counters (see lib/analytics/events.ts).
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const result = await computePopularClubs(20);

  return NextResponse.json({
    source: result.source,
    eventsConsidered: result.eventsConsidered,
    minEventsForRanking: MIN_EVENTS_FOR_RANKING,
    windows: {
      recentDays: RECENT_WINDOW_DAYS,
      baselineDays: BASELINE_WINDOW_DAYS,
      recentWeight: RECENT_WEIGHT,
    },
    weights: EVENT_WEIGHTS,
    ranking: result.clubs.map((entry, index) => ({
      rank: index + 1,
      clubId: entry.club.id,
      slug: entry.club.slug,
      name: entry.club.name,
      score: Number(entry.score.toFixed(4)),
    })),
  });
}
