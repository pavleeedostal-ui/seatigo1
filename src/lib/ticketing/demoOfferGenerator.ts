import type { Match } from "@/types/football";
import type { SeatCategoryKey, TicketOffer } from "@/types/ticketing";

/** Small deterministic PRNG so demo offers stay stable per fixture+provider between requests. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const CATEGORY_BASE_PRICE: Record<SeatCategoryKey, number> = {
  behind_goal: 1,
  shortside: 1.25,
  longside: 1.55,
  premium: 2.6,
  hospitality: 4.4,
};

const SECTION_NAMES: Record<SeatCategoryKey, string[]> = {
  behind_goal: ["Block 101", "Block 130", "Family Stand", "North End Lower"],
  shortside: ["Corner Block 12", "Corner Block 44", "Lower Bowl Corner"],
  longside: ["East Stand Upper", "West Stand Lower", "Main Stand Central"],
  premium: ["Club Level", "Pitchside Premium", "Halfway Line Premium"],
  hospitality: ["Directors' Lounge", "Skybox Suite", "Legends Lounge"],
};

export interface DemoProviderProfile {
  providerId: string;
  /** Multiplies the shared base price, e.g. a budget seller vs a premium one. */
  priceBias: number;
  /** +/- jitter fraction applied per offer so prices aren't perfectly round. */
  jitter: number;
  feesIncluded: boolean;
  deliveryMethod: TicketOffer["deliveryMethod"];
  /** Fraction of the 5 categories this seller typically lists (not every seller has every category). */
  categoryCoverage: number;
  sponsored?: boolean;
}

/**
 * Shared demo/generation logic used by every demo-backed provider adapter.
 * A real adapter would replace this entirely with an API call to the
 * seller's own inventory feed — the output shape (TicketOffer[]) is what
 * matters and is identical either way.
 */
/**
 * Whether the demo market has any inventory for a fixture at all. Shared by
 * every demo adapter so a fixture is either listed by sellers or by nobody,
 * the way a real market behaves — a fixture with no listings is a normal
 * state, not an error.
 *
 * Nothing is ever listed for a fixture without a confirmed kickoff: sellers
 * cannot sell a seat for a slot the league has not announced.
 */
export function hasDemoInventory(fixture: Match): boolean {
  if (!fixture.kickoffTime) return false;
  if (fixture.status !== "scheduled") return false;

  // Deterministic per fixture, so the state is stable across requests and
  // identical for every seller.
  const rand = mulberry32(hashSeed(`inventory:${fixture.id}`));
  return rand() > 0.3;
}

export function generateDemoOffers(
  fixture: Match,
  profile: DemoProviderProfile,
): TicketOffer[] {
  if (!hasDemoInventory(fixture)) return [];

  const rand = mulberry32(hashSeed(`${fixture.id}:${profile.providerId}`));
  const categories = Object.keys(CATEGORY_BASE_PRICE) as SeatCategoryKey[];
  const offers: TicketOffer[] = [];

  const basePricePerSeat = 60 + Math.round(rand() * 60);

  categories.forEach((category, index) => {
    if (rand() > profile.categoryCoverage) return;

    const sections = SECTION_NAMES[category];
    const section = sections[Math.floor(rand() * sections.length)];
    const jitterFactor = 1 + (rand() * 2 - 1) * profile.jitter;
    const price = Math.round(
      basePricePerSeat * CATEGORY_BASE_PRICE[category] * profile.priceBias * jitterFactor,
    );
    const quantityAvailable = 1 + Math.floor(rand() * 8);
    const minutesAgo = Math.floor(rand() * 10) + 1;

    offers.push({
      id: `${profile.providerId}__${fixture.id}-${category}-${index}`,
      fixtureId: fixture.id,
      providerId: profile.providerId,
      externalOfferId: `${fixture.id}-${category}-${index}`,
      category,
      section,
      quantityAvailable,
      price,
      currency: "EUR",
      feesIncluded: profile.feesIncluded,
      deliveryMethod: profile.deliveryMethod,
      deeplink: `https://${profile.providerId}.example/tickets/${fixture.slug}?offer=${fixture.id}-${category}-${index}`,
      lastUpdated: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
      sponsored: profile.sponsored,
    });
  });

  return offers;
}

type FixtureLookup = (fixtureId: string) => Promise<Match | undefined>;

let sharedFixtureLookup: FixtureLookup = async () => undefined;

/**
 * The aggregator is the only thing that knows how to look fixtures up (it
 * holds the football data provider), so it registers a lookup here once at
 * startup. Every demo-backed provider adapter shares this same registration
 * instead of each wiring its own.
 */
export function registerFixtureLookup(lookup: FixtureLookup) {
  sharedFixtureLookup = lookup;
}

export async function findDemoOfferById(
  profile: DemoProviderProfile,
  externalOfferId: string,
): Promise<TicketOffer | null> {
  const fixtureId = externalOfferId.split("-").slice(0, -2).join("-") || externalOfferId;
  const fixture = await sharedFixtureLookup(fixtureId);
  if (!fixture) return null;

  return (
    generateDemoOffers(fixture, profile).find(
      (offer) => offer.externalOfferId === externalOfferId,
    ) ?? null
  );
}
