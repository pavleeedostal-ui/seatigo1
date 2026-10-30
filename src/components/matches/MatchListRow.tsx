import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { formatKickoffTime, formatMatchDate } from "@/lib/format";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixturePrice } from "./FixturePrice";
import { cn } from "@/lib/utils";

/**
 * A fixture as one line of an album page: kickoff, the pairing, where, and
 * the price — the four things a comparison scan needs, in reading order.
 *
 * Stuck in (white, lifted) when sellers have offers; an empty dashed slot
 * when they do not. Both are links, both lead to the fixture page.
 * Below `lg` the blocks stack inside the slot.
 */
export function MatchListRow({
  match,
  offersSummary,
  tickets,
  showDate = false,
}: {
  match: Match;
  offersSummary?: CheapestOfferSummary | null;
  tickets?: string;
  /** Rows under a date heading leave the day out; a flat sorted list needs it. */
  showDate?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Matches");
  const availability = getTicketAvailability(match, Boolean(offersSummary));
  const stuck = availability === "available";

  const time = match.kickoffTime ? formatKickoffTime(match.kickoffTime, locale) : null;
  const day = match.kickoffTime
    ? formatMatchDate(match.kickoffTime, locale)
    : match.date
      ? formatMatchDate(match.date, locale)
      : null;

  return (
    <Link
      href={tickets ? `/matches/${match.slug}?tickets=${tickets}` : `/matches/${match.slug}`}
      // Picked up by the delegated listener in CtaTracker, so counting a
      // ticket click costs this server component no client JavaScript.
      {...(stuck
        ? {
            "data-seatigo-cta": "compare_tickets_click",
            "data-seatigo-clubs": `${match.homeTeam.id},${match.awayTeam.id}`,
            "data-seatigo-fixture": match.id,
          }
        : {})}
      className="group block rounded-card focus-visible:outline-offset-4"
    >
      <article
        className={cn(
          "flex flex-col gap-4 rounded-card p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6",
          stuck ? "sticker" : "slot-empty",
        )}
      >
        <div className="flex min-w-0 items-center gap-3 lg:w-[176px] lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-2">
          <p className="font-tab tabular inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-[6px] bg-album px-2 py-1 text-[12px] leading-none text-white">
            {showDate && day && <span>{day}</span>}
            {showDate && day && <span aria-hidden="true" className="h-3 w-px bg-white/40" />}
            <span>{time ?? t("card.timeTbc")}</span>
          </p>
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-muted">
            <CompetitionLogo competition={match.competition} size={18} />
            <span className="min-w-0 truncate">{match.competition.name}</span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
            <TeamLine club={match.homeTeam} />
            <span className="font-tab hidden text-[12px] text-ink-muted sm:inline">v</span>
            <TeamLine club={match.awayTeam} />
          </div>
          <p className="mt-2 truncate text-[13px] text-ink-muted">
            {match.stadium
              ? [match.stadium.name, match.city].filter(Boolean).join(" · ")
              : t("card.venueTbc")}
            {match.kickoffTime && match.kickoffProvisional && (
              <span> · {t("card.timeProvisional")}</span>
            )}
            {match.status === "postponed" && <span> · {t("card.postponed")}</span>}
          </p>
        </div>

        <div
          className={cn(
            "flex items-end justify-between gap-4 border-t pt-4 lg:w-[240px] lg:shrink-0 lg:border-t-0 lg:pt-0",
            stuck ? "border-line" : "border-dashed border-line-strong",
          )}
        >
          <div className="min-w-0">
            <FixturePrice availability={availability} summary={offersSummary} />
          </div>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
              stuck
                ? "bg-ink text-white group-hover:bg-album"
                : "border border-line-strong text-ink-muted group-hover:border-ink group-hover:text-ink",
            )}
          >
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function TeamLine({ club }: { club: Match["homeTeam"] }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <ClubLogo club={club} size={30} />
      <span className="font-display truncate text-[22px] text-ink sm:text-[24px]">{club.name}</span>
    </span>
  );
}
