import type { OfferSortKey, TicketOfferWithProvider } from "@/types/ticketing";

/**
 * Pure offer sorting — no data-fetching dependencies, so both the server
 * aggregator and the client-side comparison UI (re-sorting after a filter
 * change) can import it without pulling in the football/ticketing provider
 * machinery.
 */

const RECOMMENDED_WEIGHTS = {
  price: 0.55,
  feeTransparency: 0.2,
  availability: 0.15,
  sponsoredBoost: 0.04,
};

export function sortOffers(
  offers: TicketOfferWithProvider[],
  sortKey: OfferSortKey,
): TicketOfferWithProvider[] {
  if (offers.length === 0) return offers;

  if (sortKey === "price_asc") {
    return [...offers].sort((a, b) => a.price - b.price);
  }
  if (sortKey === "price_desc") {
    return [...offers].sort((a, b) => b.price - a.price);
  }
  if (sortKey === "best_seats") {
    const rank: Record<string, number> = {
      hospitality: 0,
      premium: 1,
      longside: 2,
      shortside: 3,
      behind_goal: 4,
    };
    return [...offers].sort((a, b) => rank[a.category] - rank[b.category] || a.price - b.price);
  }

  // recommended: weighted score from real offer attributes only — never a
  // hardcoded "featured" pick. Sponsored offers get a small, disclosed
  // boost; they never jump ahead of a much cheaper organic offer.
  const prices = offers.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const scored = offers.map((offer) => {
    const normalizedPrice = (offer.price - minPrice) / priceRange;
    const normalizedAvailability = Math.min(offer.quantityAvailable, 8) / 8;
    const score =
      RECOMMENDED_WEIGHTS.price * (1 - normalizedPrice) +
      RECOMMENDED_WEIGHTS.feeTransparency * (offer.feesIncluded ? 1 : 0) +
      RECOMMENDED_WEIGHTS.availability * normalizedAvailability +
      (offer.sponsored ? RECOMMENDED_WEIGHTS.sponsoredBoost : 0);
    return { offer, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.offer);
}
