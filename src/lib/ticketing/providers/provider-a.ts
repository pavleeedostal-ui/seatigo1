import type { Match } from "@/types/football";
import type { TicketOffer, TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "../types";
import { findDemoOfferById, generateDemoOffers } from "../demoOfferGenerator";

/**
 * Demo stand-in for a budget-focused resale marketplace. Swap the body of
 * `searchOffers`/`getOfferDetails` for real HTTP calls to go live — the
 * TicketProviderAdapter contract stays identical either way.
 */
export const providerAMeta: TicketProvider = {
  id: "provider-a",
  name: "SeatSnap",
  website: "https://seatsnap.example",
  affiliateNetwork: "seatsnap-partners",
  active: true,
  supportedCountries: ["GB", "IE", "FR", "DE", "ES", "IT"],
  supportedCurrencies: ["EUR", "GBP"],
};

const profile = {
  providerId: "provider-a",
  priceBias: 0.92,
  jitter: 0.12,
  feesIncluded: false,
  deliveryMethod: "mobile" as const,
  categoryCoverage: 0.8,
};

export const providerA: TicketProviderAdapter = {
  id: "provider-a",
  async searchOffers(fixture: Match): Promise<TicketOffer[]> {
    return generateDemoOffers(fixture, profile);
  },
  async getOfferDetails(externalOfferId: string): Promise<TicketOffer | null> {
    return findDemoOfferById(profile, externalOfferId);
  },
};
