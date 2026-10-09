/**
 * The five things Seatigo counts to work out which clubs people are
 * actually interested in.
 *
 * Deliberately narrow. An event carries what happened, which club(s) it
 * concerned, optionally which fixture, and when — and nothing else. No
 * visitor identifier, no IP, no cookie, no user agent, no referrer. Nothing
 * here can be traced back to a person, which is why it needs no consent
 * banner and no retention policy beyond keeping the counters small.
 */
export type AnalyticsEventType =
  | "club_page_view"
  | "club_search"
  | "match_view"
  | "compare_tickets_click"
  | "seller_outbound_click";

export const ANALYTICS_EVENT_TYPES: readonly AnalyticsEventType[] = [
  "club_page_view",
  "club_search",
  "match_view",
  "compare_tickets_click",
  "seller_outbound_click",
] as const;

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return (
    typeof value === "string" &&
    (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  /**
   * The club ids this event is interest in — one for a club page or search,
   * both sides for a fixture.
   *
   * Always Seatigo's internal club id (`c-arsenal`), never a name, slug or
   * search alias. That is what stops "Man Utd", "Manchester United" and
   * "manchester-united" counting as three different clubs.
   */
  clubIds: string[];
  /** The fixture involved, where there is one. */
  fixtureId?: string | null;
  /** Defaults to now. */
  at?: Date;
}
