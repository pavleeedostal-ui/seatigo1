/**
 * What makes two listings the same listing.
 *
 * `TicketOffer.id` is `${providerId}__${externalOfferId}` — the provider's
 * own identifier for the listing, namespaced by the provider. That is the
 * only identity that is stable across a refetch, which is why it is what
 * the `/go` redirect route resolves against, and it is the right key for
 * deduplication: the same listing can legitimately arrive twice when an
 * adapter retries, when two provider feeds overlap, or when an affiliate
 * network re-exposes a seller Seatigo already queries directly.
 *
 * Deliberately *not* deduplicated: two listings from one seller that happen
 * to share a category, section and price. Those are plausibly two genuine
 * blocks of seats, and collapsing them would under-report real inventory —
 * a worse error than counting both, because it hides tickets that exist.
 */
export function dedupeOffers<T extends { id: string }>(offers: T[]): T[] {
  const seen = new Map<string, T>();
  for (const offer of offers) {
    if (!seen.has(offer.id)) seen.set(offer.id, offer);
  }
  return [...seen.values()];
}

/** Distinct sellers behind a set of offers. */
export function sellerCountOf(offers: { providerId: string }[]): number {
  return new Set(offers.map((offer) => offer.providerId)).size;
}
