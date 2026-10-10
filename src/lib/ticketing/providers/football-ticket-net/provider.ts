import type { Match } from "@/types/football";
import type { TicketOffer, TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "../../types";
import {
  buildAffiliateUrl,
  FOOTBALL_TICKET_NET_PROVIDER_ID,
  isConfigured,
  readConfig,
  searchEvents,
} from "./client";
import { selectEventForFixture, toTicketOffers } from "./mapper";

/**
 * Football Ticket Net — Seatigo's first non-demo ticket provider.
 *
 * It is a real integration in every respect except the two things only
 * Football Ticket Net can supply: the documented endpoint shapes, and
 * credentials. Until both exist this adapter is inert — `isEnabled()`
 * reports false without credentials, the registry leaves it out, and it
 * contributes nothing.
 *
 * It has **no demo mode on purpose**. The other adapters in this directory
 * generate plausible offers so the comparison UI has something to show;
 * this one must never do that, because a generated price attributed to a
 * named real marketplace is a false statement about what a real company is
 * charging. No credentials means no offers.
 */
export const footballTicketNetMeta: TicketProvider = {
  id: FOOTBALL_TICKET_NET_PROVIDER_ID,
  name: "Football Ticket Net",
  website: "https://www.footballticketnet.com",
  // TODO(ftn-api): replace with the affiliate programme or network named in
  // the signed agreement, once there is one.
  affiliateNetwork: "football-ticket-net-affiliates",
  /**
   * A secondary marketplace: inventory is listed by third-party sellers,
   * not issued by the club. Seatigo links out and never handles payment.
   */
  marketType: "secondary",
  active: true,
  // TODO(ftn-api): replace with the markets the agreement actually covers.
  supportedCountries: [
    "GB", "ES", "IT", "DE", "FR", "NL", "PT", "BE", "AT", "CZ", "PL", "TR", "GR",
  ],
  supportedCurrencies: ["EUR", "GBP", "USD"],
};

export const footballTicketNetProvider: TicketProviderAdapter = {
  id: FOOTBALL_TICKET_NET_PROVIDER_ID,

  /**
   * Off until configured. The registry checks this before including the
   * adapter, so an unconfigured deployment never even opens a connection.
   */
  isEnabled(): boolean {
    return isConfigured();
  },

  /**
   * Offers for one Seatigo fixture.
   *
   * The direction matters: Seatigo asks "what does this seller have for
   * *this* fixture?", never "what fixtures does this seller know about?".
   * An event the provider returns that does not match the fixture is
   * dropped. It can never become a fixture — that list belongs to the
   * football data provider.
   */
  async searchOffers(fixture: Match): Promise<TicketOffer[]> {
    if (!isConfigured()) return [];

    const events = await searchEvents({
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      date: fixture.date,
    });
    if (events.length === 0) return [];

    const event = selectEventForFixture(events, fixture);
    if (!event) return [];

    return toTicketOffers(event, fixture);
  },

  /**
   * Resolving one offer by its external id.
   *
   * TODO(ftn-api): implement against the documented single-listing
   * endpoint. Until then this returns null, which the `/go` route already
   * treats as "unknown offer" and handles by sending the visitor back to
   * the match list rather than anywhere off-site.
   */
  async getOfferDetails(): Promise<TicketOffer | null> {
    return null;
  },

  /**
   * Attaches affiliate tracking on the way out.
   *
   * Called by `/go/[offerId]` immediately before redirecting, so the
   * affiliate id is applied server-side and an offer object that reaches
   * the browser carries only the plain seller URL. Returning null refuses
   * the redirect.
   */
  decorateOutboundUrl(deeplink: string): string | null {
    const result = readConfig();
    if (!result.ok) return null;
    return buildAffiliateUrl(deeplink, result.config.affiliateId);
  },
};
