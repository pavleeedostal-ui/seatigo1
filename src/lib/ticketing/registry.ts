import type { TicketProvider } from "@/types/ticketing";
import type { TicketProviderAdapter } from "./types";
import { demoProvider, demoProviderMeta } from "./providers/demo";
import { providerA, providerAMeta } from "./providers/provider-a";
import { providerB, providerBMeta } from "./providers/provider-b";
import { providerC, providerCMeta } from "./providers/provider-c";
import {
  footballTicketNetMeta,
  footballTicketNetProvider,
} from "./providers/football-ticket-net/provider";

interface RegistryEntry {
  adapter: TicketProviderAdapter;
  meta: TicketProvider;
  /**
   * `demo` adapters invent plausible inventory so the comparison UI has
   * something to show while Seatigo has no signed sellers. `live` adapters
   * talk to a real marketplace and show only what it actually returns.
   *
   * The two never run together. Mixing a generated price into a list
   * beside a real one would make the real one untrustworthy.
   */
  kind: "demo" | "live";
}

/**
 * Every ticket seller Seatigo knows about.
 *
 * `TICKETING_MODE=demo` (the default) runs the demo adapters, so the
 * comparison UI always has realistic multi-seller data.
 *
 * `TICKETING_MODE=live` runs only the real adapters, and only those whose
 * credentials are present. A live deployment with nothing configured
 * therefore shows "No offers available yet" on a fixture — which is the
 * truth — while the fixture itself stays discoverable.
 *
 * Adding a seller is one entry here plus a directory under `providers/`;
 * nothing above the aggregator changes.
 */
const registry: RegistryEntry[] = [
  { adapter: demoProvider, meta: demoProviderMeta, kind: "demo" },
  { adapter: providerA, meta: providerAMeta, kind: "demo" },
  { adapter: providerB, meta: providerBMeta, kind: "demo" },
  { adapter: providerC, meta: providerCMeta, kind: "demo" },
  {
    adapter: footballTicketNetProvider,
    meta: footballTicketNetMeta,
    kind: "live",
  },
];

export function isDemoMode(): boolean {
  return (process.env.TICKETING_MODE ?? "demo") !== "live";
}

/**
 * The providers to call right now: the demo set or the live set, filtered
 * to those switched on and able to run.
 */
export function getActiveProviders(): RegistryEntry[] {
  const wanted = isDemoMode() ? "demo" : "live";
  return registry.filter(
    (entry) =>
      entry.kind === wanted &&
      entry.meta.active &&
      (entry.adapter.isEnabled?.() ?? true),
  );
}

export function getProviderMeta(providerId: string): TicketProvider | null {
  return registry.find((entry) => entry.meta.id === providerId)?.meta ?? null;
}

export function getProviderAdapter(providerId: string): TicketProviderAdapter | null {
  return registry.find((entry) => entry.adapter.id === providerId)?.adapter ?? null;
}

/** Diagnostics: what each registered seller's state is, without calling it. */
export function describeProviders(): {
  id: string;
  kind: "demo" | "live";
  active: boolean;
  enabled: boolean;
}[] {
  return registry.map((entry) => ({
    id: entry.meta.id,
    kind: entry.kind,
    active: entry.meta.active,
    enabled: entry.adapter.isEnabled?.() ?? true,
  }));
}
