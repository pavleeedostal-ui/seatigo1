import type { TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "./types";
import { demoProvider, demoProviderMeta } from "./providers/demo";
import { providerA, providerAMeta } from "./providers/provider-a";
import { providerB, providerBMeta } from "./providers/provider-b";
import { providerC, providerCMeta } from "./providers/provider-c";

interface RegistryEntry {
  adapter: TicketProviderAdapter;
  meta: TicketProvider;
}

/**
 * Every ticket seller Seatigo knows about, demo or real. Toggle a seller
 * on/off in production by flipping `active` in its meta (see each file
 * under `providers/`) or by env var — nothing else needs to change.
 *
 * `TICKETING_MODE=demo` (default) runs every adapter below, so the
 * comparison UI always has realistic multi-seller data to show. Set
 * `TICKETING_MODE=live` once real provider adapters replace the demo
 * bodies, so a market with no connected sellers correctly shows
 * "Ticket offers coming soon" instead of demo prices.
 */
const registry: RegistryEntry[] = [
  { adapter: demoProvider, meta: demoProviderMeta },
  { adapter: providerA, meta: providerAMeta },
  { adapter: providerB, meta: providerBMeta },
  { adapter: providerC, meta: providerCMeta },
];

export function isDemoMode(): boolean {
  return (process.env.TICKETING_MODE ?? "demo") !== "live";
}

export function getActiveProviders(): RegistryEntry[] {
  if (!isDemoMode()) return [];
  return registry.filter((entry) => entry.meta.active);
}

export function getProviderMeta(providerId: string): TicketProvider | null {
  return registry.find((entry) => entry.meta.id === providerId)?.meta ?? null;
}

export function getProviderAdapter(providerId: string): TicketProviderAdapter | null {
  return registry.find((entry) => entry.adapter.id === providerId)?.adapter ?? null;
}
