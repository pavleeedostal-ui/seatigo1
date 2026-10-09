import type { Match } from "@/types/football";

/**
 * How a fixture presents in discovery UI. This is the single place the two
 * data layers meet: the fixture says whether it is scheduled, the ticketing
 * layer says whether anyone is selling. Neither can hide a fixture.
 */
export type TicketAvailability =
  /** At least one verified offer from a connected seller. */
  | "available"
  /** A genuine upcoming fixture that no connected seller has listed. */
  | "no_offers"
  /** Announced, but without a confirmed kickoff slot — nothing to sell yet. */
  | "not_announced";

export function getTicketAvailability(
  match: Match,
  hasOffers: boolean,
): TicketAvailability {
  if (!match.kickoffTime) return "not_announced";
  return hasOffers ? "available" : "no_offers";
}

/** The three states the `availability` URL filter accepts. */
export type AvailabilityFilter = "all" | "available" | "no_offers";

export function matchesAvailabilityFilter(
  availability: TicketAvailability,
  filter: AvailabilityFilter | undefined,
): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "available") return availability === "available";
  // "No offers yet" covers both reasons a fixture has nothing to compare.
  return availability !== "available";
}
