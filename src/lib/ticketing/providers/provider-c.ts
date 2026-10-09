import type { Match } from "@/types/football";
import type { TicketOffer, TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "../types";
import { findDemoOfferById, generateDemoOffers } from "../demoOfferGenerator";

/**
 * Demo stand-in for a premium/hospitality-leaning seller that has a
 * sponsored placement deal with Seatigo. Every offer it produces carries
 * `sponsored: true` — the aggregator and UI must always keep that visible
 * and must never present it as an organic "best price" pick.
 */
export const providerCMeta: TicketProvider = {
  id: "provider-c",
  name: "StadiumHub",
  website: "https://stadiumhub.example",
  affiliateNetwork: "stadiumhub-sponsored",
  active: true,
  supportedCountries: ["*"],
  supportedCurrencies: ["EUR"],
};

const profile = {
  providerId: "provider-c",
  priceBias: 1.15,
  jitter: 0.05,
  feesIncluded: true,
  deliveryMethod: "mobile" as const,
  categoryCoverage: 0.6,
  sponsored: true,
};

export const providerC: TicketProviderAdapter = {
  id: "provider-c",
  async searchOffers(fixture: Match): Promise<TicketOffer[]> {
    return generateDemoOffers(fixture, profile);
  },
  async getOfferDetails(externalOfferId: string): Promise<TicketOffer | null> {
    return findDemoOfferById(profile, externalOfferId);
  },
};
