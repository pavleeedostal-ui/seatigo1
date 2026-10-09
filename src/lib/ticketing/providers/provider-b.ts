import type { Match } from "@/types/football";
import type { TicketOffer, TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "../types";
import { findDemoOfferById, generateDemoOffers } from "../demoOfferGenerator";

/**
 * Demo stand-in for a mid-market seller with all-in pricing. Swap the body
 * of `searchOffers`/`getOfferDetails` for real HTTP calls to go live.
 */
export const providerBMeta: TicketProvider = {
  id: "provider-b",
  name: "MatchDay Tickets",
  website: "https://matchdaytickets.example",
  affiliateNetwork: "matchday-cpa",
  active: true,
  supportedCountries: ["*"],
  supportedCurrencies: ["EUR"],
};

const profile = {
  providerId: "provider-b",
  priceBias: 1.05,
  jitter: 0.06,
  feesIncluded: true,
  deliveryMethod: "e-ticket" as const,
  categoryCoverage: 0.9,
};

export const providerB: TicketProviderAdapter = {
  id: "provider-b",
  async searchOffers(fixture: Match): Promise<TicketOffer[]> {
    return generateDemoOffers(fixture, profile);
  },
  async getOfferDetails(externalOfferId: string): Promise<TicketOffer | null> {
    return findDemoOfferById(profile, externalOfferId);
  },
};
