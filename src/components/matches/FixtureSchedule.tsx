import { useLocale, useTranslations } from "next-intl";
import type { Match } from "@/types/football";
import { formatMatchDate, formatMatchDateLong, formatKickoffTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * When and where, from whatever the football provider actually confirmed.
 * Missing information is stated plainly ("Time TBC") rather than filled in,
 * so an unscheduled fixture reads as announced-but-pending, not broken.
 */
export function FixtureSchedule({
  match,
  variant = "short",
  /**
   * Cards repeat the TBC wording in their availability slot, so they turn
   * this off here and the line shows only what is actually confirmed.
   */
  showTbc = true,
  className,
}: {
  match: Match;
  variant?: "short" | "long";
  showTbc?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Matches.card");
  const tDetail = useTranslations("MatchDetail");

  const long = variant === "long";
  const formatDate = long ? formatMatchDateLong : formatMatchDate;

  let when: string | null;
  if (match.kickoffTime) {
    const time = formatKickoffTime(match.kickoffTime, locale);
    when = long
      ? `${formatDate(match.kickoffTime, locale)} · ${tDetail("kickoff")} ${time}`
      : `${formatDate(match.kickoffTime, locale)} · ${time}`;
  } else if (match.date) {
    const day = formatDate(match.date, locale);
    when = showTbc ? `${day} · ${t("timeTbc")}` : day;
  } else {
    when = showTbc ? t("dateTbc") : null;
  }

  const where = match.stadium
    ? [match.stadium.name, match.city].filter(Boolean).join(" · ")
    : t("venueTbc");

  return (
    <div className={cn(long ? "text-[15px]" : "text-[14px]", "text-ink-muted", className)}>
      {when && (
        <p className={long ? "mt-5" : undefined}>
          {when}
          {/* The league publishes a default time until broadcasters pick the
              slot; say so rather than presenting it as confirmed. */}
          {match.kickoffTime && match.kickoffProvisional && (
            <span className="ml-2 text-ink-faint">· {t("timeProvisional")}</span>
          )}
          {match.status === "postponed" && (
            <span className="ml-2 text-ink-faint">· {t("postponed")}</span>
          )}
        </p>
      )}
      <p className={cn("truncate", long && "mt-1")}>{where}</p>
    </div>
  );
}
