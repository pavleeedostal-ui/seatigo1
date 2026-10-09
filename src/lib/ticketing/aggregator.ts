import type { Match } from "@/types/football";
import type {
  CheapestOfferSummary,
  OffersResult,
  TicketOfferWithProvider,
} from "@/types/ticketing";
import { getFootballDataProvider } from "@/lib/football";
import { registerFixtureLookup } from "./demoOfferGenerator";
import { getActiveProviders, getProviderAdapter, getProviderMeta } from "./registry";
import { sortOffers } from "./sort";

// Demo-backed provider adapters resolve a fixture id back to a full Match
// (e.g. to rebuild an offer from an externalOfferId in getOfferDetails).
// The aggregator is the only thing that holds the football data provider,
// so it registers the lookup once here for every demo adapter to share.
registerFixtureLookup((fixtureId) => getFootballDataProvider().getMatchById(fixtureId).then((m) => m ?? undefined));

/**
 * Calls every active ticket provider for a fixture, normalizes their
 * responses into one shape, drops duplicate listings, and returns them
 * ready for the comparison UI — sorted, with the lowest price and seller
 * count already computed. This is the only place the rest of the app
 * needs to know about to get ticket offers; it never talks to a specific
 * provider directly.
 */
export async function getOffersForFixture(fixture: Match): Promise<OffersResult> {
  const providers = getActiveProviders();

  const results = await Promise.allSettled(
    providers.map(({ adapter }) => adapter.searchOffers(fixture)),
  );

  const seen = new Map<string, TicketOfferWithProvider>();

  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const meta = providers[index].meta;
    for (const offer of result.value) {
      if (seen.has(offer.id)) continue; // drop exact duplicates
      seen.set(offer.id, { ...offer, provider: meta });
    }
  });

  const offers = sortOffers(Array.from(seen.values()), "recommended");
  const prices = offers.map((o) => o.price);
  const lastUpdatedTimes = offers.map((o) => new Date(o.lastUpdated).getTime());
  const sellerIds = new Set(offers.map((o) => o.providerId));

  return {
    fixtureId: fixture.id,
    offers,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    currency: offers[0]?.currency ?? null,
    sellerCount: sellerIds.size,
    lastUpdated: lastUpdatedTimes.length
      ? new Date(Math.max(...lastUpdatedTimes)).toISOString()
      : null,
  };
}

/** Batch helper for list/home pages: one cheapest-offer summary per fixture, skipping fixtures with no offers. */
export async function getCheapestOffersForFixtures(
  fixtures: Match[],
): Promise<Map<string, CheapestOfferSummary>> {
  const summaries = new Map<string, CheapestOfferSummary>();

  await Promise.all(
    fixtures.map(async (fixture) => {
      const result = await getOffersForFixture(fixture);
      if (result.lowestPrice != null && result.currency) {
        const categories = Array.from(new Set(result.offers.map((o) => o.category)));
        summaries.set(fixture.id, {
          fixtureId: fixture.id,
          lowestPrice: result.lowestPrice,
          currency: result.currency,
          offerCount: result.offers.length,
          categories,
          providerIds: Array.from(new Set(result.offers.map((o) => o.providerId))),
          hasPremiumSeating: categories.some(
            (c) => c === "premium" || c === "hospitality",
          ),
          maxQuantityAvailable: Math.max(...result.offers.map((o) => o.quantityAvailable)),
        });
      }
    }),
  );

  return summaries;
}

/** Used by the /go/[offerId] redirect route to resolve an offer without the frontend ever seeing the deeplink. */
export async function getOfferByRedirectId(
  offerId: string,
): Promise<TicketOfferWithProvider | null> {
  const separatorIndex = offerId.indexOf("__");
  if (separatorIndex === -1) return null;

  const providerId = offerId.slice(0, separatorIndex);
  const externalOfferId = offerId.slice(separatorIndex + 2);

  const adapter = getProviderAdapter(providerId);
  const meta = getProviderMeta(providerId);
  if (!adapter || !meta || !meta.active) return null;

  const offer = await adapter.getOfferDetails(externalOfferId);
  if (!offer) return null;

  return { ...offer, provider: meta };
}
