export type SeatCategoryKey =
  | "longside"
  | "shortside"
  | "behind_goal"
  | "premium"
  | "hospitality";

export type DeliveryMethod = "mobile" | "e-ticket" | "post" | "box-office";

export type OfferSortKey =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "best_seats";

/**
 * A ticket seller Seatigo compares offers from. Never a Seatigo-owned
 * inventory — Seatigo links out to the provider's own checkout.
 */
export interface TicketProvider {
  id: string;
  name: string;
  logo?: string;
  website: string;
  /** Affiliate network or program this provider is contracted through, if any. */
  affiliateNetwork?: string;
  active: boolean;
  supportedCountries: string[];
  supportedCurrencies: string[];
}

/**
 * A single seller's listing for one seating category on one fixture.
 * This is the normalized shape every provider adapter must produce —
 * the frontend only ever sees this shape, never a provider-specific one.
 */
export interface TicketOffer {
  /** `${providerId}__${externalOfferId}`, stable and used by the /go redirect route. */
  id: string;
  fixtureId: string;
  providerId: string;
  externalOfferId: string;
  category: SeatCategoryKey;
  section: string;
  quantityAvailable: number;
  price: number;
  currency: string;
  feesIncluded: boolean;
  deliveryMethod?: DeliveryMethod;
  /** Outbound URL on the provider's site. Only used server-side by the /go route. */
  deeplink: string;
  lastUpdated: string;
  sponsored?: boolean;
}

export interface TicketOfferWithProvider extends TicketOffer {
  provider: TicketProvider;
}

export interface OffersResult {
  fixtureId: string;
  offers: TicketOfferWithProvider[];
  lowestPrice: number | null;
  currency: string | null;
  sellerCount: number;
  lastUpdated: string | null;
}

export interface CheapestOfferSummary {
  fixtureId: string;
  lowestPrice: number;
  currency: string;
  offerCount: number;
  /** Distinct seat categories on offer, for the search-results category filter. */
  categories: SeatCategoryKey[];
  /** Distinct seller ids on offer, for the search-results provider filter. */
  providerIds: string[];
  /** True if any offer is in the premium/hospitality tier — used by the "Best seats" sort. */
  hasPremiumSeating: boolean;
  /** Largest quantityAvailable across all offers — used to filter out matches that can't fit a requested group size. */
  maxQuantityAvailable: number;
}
