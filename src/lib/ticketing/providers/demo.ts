import type { Match } from "@/types/football";
import type { TicketOffer, TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "../types";
import { findDemoOfferById, generateDemoOffers } from "../demoOfferGenerator";

/**
 * Reference adapter used whenever no real provider is configured for a
 * market. Clearly a demo seller (id/name say so) so it's never mistaken
 * for a real ticket outlet in the UI.
 */
export const demoProviderMeta: TicketProvider = {
  id: "demo",
  name: "Seatigo Demo Seller",
  website: "https://demo.example",
  active: true,
  supportedCountries: ["*"],
  supportedCurrencies: ["EUR"],
};

const profile = {
  providerId: "demo",
  priceBias: 1,
  jitter: 0.08,
  feesIncluded: true,
  deliveryMethod: "mobile" as const,
  categoryCoverage: 0.7,
};

export const demoProvider: TicketProviderAdapter = {
  id: "demo",
  async searchOffers(fixture: Match): Promise<TicketOffer[]> {
    return generateDemoOffers(fixture, profile);
  },
  async getOfferDetails(externalOfferId: string): Promise<TicketOffer | null> {
    return findDemoOfferById(profile, externalOfferId);
  },
};
