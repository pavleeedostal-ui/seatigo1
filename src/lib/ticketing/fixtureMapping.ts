/**
 * Different ticket providers rarely share Seatigo's fixture identifiers.
 * A real integration resolves each provider's own event id for a given
 * Seatigo fixture — typically by matching home team + away team +
 * competition + kickoff date/time + stadium, then caching the result.
 *
 * Seatigo's internal fixture id is stable and human-readable, e.g.
 * "arsenal-chelsea-2026-10-18" (see Match.slug + Match.date in
 * src/lib/football). This module is the single place that would hold the
 * seatigo-fixture-id -> provider-event-id table once real providers are
 * connected — every adapter should resolve ids through here rather than
 * assuming Seatigo's id works unchanged on the provider's side.
 *
 * Demo providers don't need real mapping (they generate offers straight
 * from the Seatigo fixture), so this currently just returns the fixture id
 * unchanged. Swap in a real lookup (DB table, provider search-by-teams
 * call, etc.) here when a real provider is wired up.
 */
export async function resolveProviderFixtureId(
  seatigoFixtureId: string,
  providerId: string,
): Promise<string | null> {
  void providerId;
  return seatigoFixtureId;
}
