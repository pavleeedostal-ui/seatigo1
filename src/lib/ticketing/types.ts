import type { Match } from "@/types/football";
import type { TicketOffer } from "@/types/ticketing";

/**
 * Every ticket seller integration implements this same interface, so the
 * aggregator (and everything above it) never needs to know which provider
 * produced an offer. Add a new seller by dropping a new adapter in
 * `src/lib/ticketing/providers/` and registering it in `registry.ts` —
 * nothing else in the app changes.
 */
export interface TicketProviderAdapter {
  id: string;
  searchOffers(fixture: Match): Promise<TicketOffer[]>;
  getOfferDetails(externalOfferId: string): Promise<TicketOffer | null>;
  /**
   * Whether this adapter can currently do its job. A real provider reports
   * false until its credentials are present, and the registry then leaves
   * it out entirely. Omitted means "always on", which is what the demo
   * adapters are.
   */
  isEnabled?(): boolean;
  /**
   * Last chance to rewrite the outbound URL, called by `/go/[offerId]`
   * just before redirecting. This is where affiliate tracking is attached,
   * so credentials stay server-side and never ride along on an offer
   * object sent to the browser.
   *
   * Returning null refuses the redirect; the visitor is sent back into
   * Seatigo rather than to an address the provider will not vouch for.
   */
  decorateOutboundUrl?(deeplink: string): string | null;
}
