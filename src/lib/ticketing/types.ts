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
}
