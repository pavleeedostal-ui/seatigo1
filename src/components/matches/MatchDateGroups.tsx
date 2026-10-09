import { useLocale, useTranslations } from "next-intl";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchListRow } from "./MatchListRow";

/**
 * Results grouped under date headings — "Today", "Tomorrow", "Saturday,
 * 17 October" — so a long list can be scanned by when rather than read
 * top to bottom.
 *
 * Grouping is presentation only: the fixtures, their order and their data
 * are exactly what the page passed in. Fixtures with no confirmed date keep
 * their place at the end under their own heading rather than being dropped.
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
      {groups.map((group) => (
        <section key={group.key} aria-label={labelFor(group.key, today, locale, t)}>
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-ink-muted">
            {labelFor(group.key, today, locale, t)}
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
      ))}
    </div>
  );
}

interface DateGroup {
  /** An ISO date, or "tbc" for fixtures without a confirmed day. */
  key: string;
  matches: Match[];
}

/** Keeps the incoming order; only inserts boundaries between days. */
function groupByDate(matches: Match[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const match of matches) {
    const key = match.date ?? "tbc";
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.matches.push(match);
    else groups.push({ key, matches: [match] });
  }
  return groups;
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
  if (key === "tbc") return t("tbc");

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
