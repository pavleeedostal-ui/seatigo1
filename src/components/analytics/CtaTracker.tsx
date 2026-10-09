"use client";

import { useEffect } from "react";

/**
 * Counts clicks on ticket calls to action.
 *
 * One delegated listener for the whole app rather than a handler on every
 * card: a fixture card is a server component wrapping the entire row in a
 * link, and giving each one an onClick would turn the busiest components in
 * the app into client components for the sake of one counter. Instead the
 * cards mark themselves with data attributes and this picks them up.
 *
 * `sendBeacon` is used because the click is immediately followed by a
 * navigation — the browser queues the request and keeps it alive across the
 * page change, where fetch would be cancelled. It fails silently by design:
 * a counter is never worth interrupting someone on their way to tickets.
 */
export function CtaTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-seatigo-cta]",
      );
      if (!target) return;

      const type = target.dataset.seatigoCta;
      if (type !== "compare_tickets_click") return;

      const clubIds = (target.dataset.seatigoClubs ?? "").split(",").filter(Boolean);
      if (clubIds.length === 0) return;

      const payload = JSON.stringify({
        type,
        clubIds,
        fixtureId: target.dataset.seatigoFixture ?? null,
      });

      try {
        navigator.sendBeacon(
          "/api/analytics/event",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        // Never block navigation for analytics.
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
