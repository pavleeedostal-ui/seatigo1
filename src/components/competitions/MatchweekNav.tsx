"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Horizontal matchweek strip. A 38-week season does not fit in a dropdown
 * that anyone wants to use, so it scrolls and auto-centres on the week being
 * viewed (or the current one).
 */
export function MatchweekNav({
  matchweeks,
  active,
  showingAll,
  basePath,
  query,
  /**
   * A UEFA league phase numbers matchdays, not weeks. Only the wording
   * differs — the strip behaves identically either way.
   */
  round = "matchweek",
}: {
  matchweeks: number[];
  /** The week being shown, or null when every week is listed. */
  active: number | null;
  showingAll: boolean;
  /** Locale-relative path of the competition, e.g. "/competitions/premier-league". */
  basePath: string;
  round?: "matchweek" | "matchday";
  /** The other filters to carry across, as plain data (no functions over the
      server/client boundary). */
  query: Record<string, string | undefined>;
}) {
  const t = useTranslations("Competitions");
  const pathname = usePathname();

  function buildHref(matchweek: number | "all"): string {
    const params = new URLSearchParams();
    params.set("matchweek", String(matchweek));
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }
  const scroller = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = activeRef.current;
    const box = scroller.current;
    if (!el || !box) return;
    // Measured against the scroller, not offsetParent — the strip is not a
    // positioned ancestor, so offsetLeft would be relative to the page.
    const delta =
      el.getBoundingClientRect().left -
      box.getBoundingClientRect().left -
      box.clientWidth / 2 +
      el.clientWidth / 2;
    // Centre without scrolling the page itself.
    box.scrollLeft += delta;
  }, [pathname, active]);

  return (
    <div className="flex items-center gap-3">
      <Link
        href={buildHref("all")}
        className={cn(
          "inline-flex h-9 shrink-0 items-center rounded-button border px-3.5 text-[14px] transition-colors",
          showingAll
            ? "border-navy bg-navy text-white"
            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
        )}
      >
        {t(round === "matchday" ? "allMatchdays" : "allMatchweeks")}
      </Link>

      <div
        ref={scroller}
        className="flex min-w-0 gap-2 overflow-x-auto scroll-smooth pb-1"
      >
        {matchweeks.map((week) => {
          const isActive = active === week;
          return (
            <Link
              key={week}
              ref={isActive ? activeRef : undefined}
              href={buildHref(week)}
              aria-current={isActive ? "page" : undefined}
              title={t(round, { number: week })}
              className={cn(
                "inline-flex h-9 w-10 shrink-0 items-center justify-center rounded-button border text-[14px] tabular-nums transition-colors",
                isActive
                  ? "border-navy bg-navy text-white"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {week}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
