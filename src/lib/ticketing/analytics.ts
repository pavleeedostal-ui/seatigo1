export interface OutboundClickEvent {
  offerId: string;
  providerId: string;
  fixtureId: string;
  category: string;
  price: number;
  currency: string;
  sponsored: boolean;
}

/**
 * Records an outbound click from `/go/[offerId]` before redirecting to the
 * seller. No cookies, no personal data, no cross-site identifiers — just
 * the offer that was clicked, which is enough to build "popular matches",
 * "popular providers" and click-through-rate reporting later.
 *
 * This is a stub: swap the body for a write to your analytics/DB of choice
 * (e.g. an events table, PostHog, a queue). Keep it fire-and-forget so a
 * slow analytics backend never delays the redirect to the seller.
 */
export function recordOutboundClick(event: OutboundClickEvent): void {
  console.info("[seatigo:outbound-click]", event);
}
