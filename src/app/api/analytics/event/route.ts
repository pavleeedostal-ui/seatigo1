import { NextResponse, type NextRequest } from "next/server";
import { isAnalyticsEventType } from "@/lib/analytics/events";
import { recordClubInterest } from "@/lib/analytics/club-popularity";

/**
 * Receives the one event that cannot be counted on the server: a click on a
 * ticket call to action, which happens before any navigation this app sees.
 *
 * Everything else (`club_page_view`, `match_view`, `club_search`,
 * `seller_outbound_click`) is recorded while rendering the page or handling
 * the redirect, so it needs no client JavaScript at all.
 *
 * The body is untrusted: the event type must be one we know, and club ids
 * must look like club ids. Nothing about the caller is read or stored — no
 * IP, no headers, no cookie — so a forged payload can skew a counter and
 * nothing else. Rate limiting belongs at the edge if that ever matters.
 */

/** Matches the ids minted in referenceData.ts, e.g. "c-manutd". */
const CLUB_ID = /^c-[a-z0-9]{1,40}$/;
const MAX_CLUBS_PER_EVENT = 2;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { type, clubIds, fixtureId } = (body ?? {}) as {
    type?: unknown;
    clubIds?: unknown;
    fixtureId?: unknown;
  };

  if (!isAnalyticsEventType(type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Only the CTA click is accepted here. The others are server-recorded, and
  // letting them in through a public endpoint would make them forgeable for
  // no benefit.
  if (type !== "compare_tickets_click") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!Array.isArray(clubIds)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ids = clubIds
    .filter((id): id is string => typeof id === "string" && CLUB_ID.test(id))
    .slice(0, MAX_CLUBS_PER_EVENT);

  if (ids.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  recordClubInterest({
    type,
    clubIds: ids,
    fixtureId: typeof fixtureId === "string" ? fixtureId.slice(0, 80) : null,
  });

  // 204: the browser is mid-navigation and has nothing to do with a body.
  return new NextResponse(null, { status: 204 });
}
