import { useLocale, useTranslations } from "next-intl";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchListRow } from "./MatchListRow";

/**
 * Results grouped under date headings — "Today", "Tomorrow", "Saturday,
 * 17 October" — so a long list can be scanned by when rather than read
 * top to bottom.
 *
 * ## Why each date appears exactly once
 *
 * An earlier version grouped *consecutive* fixtures, which is correct only
 * while the list is already in date order. Hand it anything else and the
 * same day reappears as several separate headings, which reads as a bug.
 * So grouping is by unique date, and the component is safe for any input
 * order.
 *
 * ## How ordering is resolved
 *
 * Grouping and sorting can genuinely disagree, so the two are separated:
 *
 * - **Groups** are ordered chronologically, always. A date heading that
 *   jumped around would be meaningless, and fixtures with no confirmed day
 *   sort last under their own heading rather than being dropped.
 * - **Rows inside a group** keep the order they arrived in, which is
 *   whatever sort the page applied. Sorting by price therefore still puts
 *   the cheapest first — within each day.
 *
 * That makes this component honest under any sort, but it does not make
 * grouping the right *choice* under any sort: a price sort is a request for
 * one global cheapest-first list, and day buckets would break it into
 * sixteen small ones. The page decides, and currently groups only for the
 * chronological sort — see `groupedByDate` in the matches page.
 */
export function MatchDateGroups({
  matches,
  offersSummaries,
  tickets,
}: {
  matches: Match[];
  offersSummaries: Map<string, CheapestOfferSummary>;
  tickets?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Matches.dates");

  const groups = groupByDate(matches);
  const today = startOfUtcDay(new Date());

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => {
        const label = labelFor(group.key, today, locale, t);
        return (
          <section key={group.key} aria-label={label}>
            <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-ink-muted">
              {label}
            </h2>
            <div className="flex flex-col gap-3">
              {group.matches.map((match) => (
                <MatchListRow
                  key={match.id}
                  match={match}
                  offersSummary={offersSummaries.get(match.id) ?? null}
                  tickets={tickets}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface DateGroup {
  /** An ISO date, or TBC_KEY for fixtures without a confirmed day. */
  key: string;
  matches: Match[];
}

/** Sorts after every real date, so unscheduled fixtures land at the end. */
const TBC_KEY = "9999-99-99";

/**
 * One group per distinct date, groups chronological, rows within a group
 * left in the order they were given.
 */
function groupByDate(matches: Match[]): DateGroup[] {
  const byDate = new Map<string, Match[]>();
  for (const match of matches) {
    const key = match.date ?? TBC_KEY;
    const bucket = byDate.get(key);
    if (bucket) bucket.push(match);
    else byDate.set(key, [match]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupMatches]) => ({ key, matches: groupMatches }));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function labelFor(
  key: string,
  today: Date,
  locale: string,
  t: (key: string) => string,
): string {
  if (key === TBC_KEY) return t("tbc");

  const date = new Date(`${key}T00:00:00Z`);
  const dayDiff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (dayDiff === 0) return t("today");
  if (dayDiff === 1) return t("tomorrow");

  // "Saturday, 17 October" — the year only once it stops being obvious.
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getUTCFullYear() !== today.getUTCFullYear() ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
}
