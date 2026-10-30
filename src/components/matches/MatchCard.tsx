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
 * A fixture as a slot in the album.
 *
 * With real offers it is a **sticker**: white, die-cut, proud of the page,
 * and it lifts like a peeled corner under the pointer. Without offers it is
 * the **empty slot**: the same layout printed as a dashed die line on the
 * page, crests and date still in place. The fixture stays on the page and
 * stays clickable either way — the difference is only whether anything is
 * stuck in yet.
 *
 * Reading order: when (the slot's tab), who, where, how much.
 *
 * `variant="lead"` is the same slot at a larger scale for the first fixtures
 * on the homepage; nothing is added that the normal card lacks.
 */
export function MatchCard({
  match,
  offersSummary,
  variant = "default",
  className,
  tickets,
}: {
  match: Match;
  offersSummary?: CheapestOfferSummary | null;
  variant?: "default" | "lead";
  className?: string;
  /** Ticket quantity carried through from a search, when there was one. */
  tickets?: string;
}) {
  const t = useTranslations("Matches");
  const availability = getTicketAvailability(match, Boolean(offersSummary));
  const lead = variant === "lead";
  const stuck = availability === "available";

  return (
    <Link
      href={tickets ? `/matches/${match.slug}?tickets=${tickets}` : `/matches/${match.slug}`}
      {...(stuck
        ? {
            "data-seatigo-cta": "compare_tickets_click",
            "data-seatigo-clubs": `${match.homeTeam.id},${match.awayTeam.id}`,
            "data-seatigo-fixture": match.id,
          }
        : {})}
      aria-label={`${match.homeTeam.name} – ${match.awayTeam.name}`}
      className={cn("group block rounded-card focus-visible:outline-offset-4", className)}
    >
      <article
        className={cn(
          "@container relative flex h-full flex-col rounded-card",
          stuck ? "sticker" : "slot-empty",
          lead ? "p-5 sm:p-6" : "p-4 sm:p-5",
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <SlotTab match={match} />
          <CompetitionLogo competition={match.competition} size={lead ? 28 : 24} />
        </header>

        <div className={cn("flex flex-col", lead ? "mt-5 gap-3" : "mt-4 gap-2.5")}>
          <TeamLine club={match.homeTeam} lead={lead} />
          <TeamLine club={match.awayTeam} lead={lead} />
        </div>

        <p className="mt-3 truncate text-[13px] text-ink-muted">
          {match.stadium
            ? [match.stadium.name, match.city].filter(Boolean).join(" · ")
            : t("card.venueTbc")}
        </p>
        {(match.kickoffProvisional || match.status === "postponed") && (
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {match.status === "postponed" ? t("card.postponed") : t("card.timeProvisional")}
          </p>
        )}

        <footer
          className={cn(
            "mt-auto flex items-end justify-between gap-3 pt-4",
            stuck ? "border-t border-line" : "border-t border-dashed border-line-strong",
            lead ? "mt-6" : "mt-5",
          )}
        >
          <div className="min-w-0">
            <FixturePrice
              availability={availability}
              summary={offersSummary}
              size={lead ? "lead" : "default"}
            />
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
            <ArrowUpRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
          </span>
        </footer>
      </article>
    </Link>
  );
}

/**
 * The slot's address: kickoff day and time, printed like the number in the
 * corner of an album slot. Unscheduled fixtures say so rather than guess.
 */
export function SlotTab({ match, className }: { match: Match; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Matches.card");

  const day = match.kickoffTime
    ? formatMatchDate(match.kickoffTime, locale)
    : match.date
      ? formatMatchDate(match.date, locale)
      : t("dateTbc");
  const time = match.kickoffTime ? formatKickoffTime(match.kickoffTime, locale) : null;

  return (
    <p
      className={cn(
        "font-tab tabular inline-flex items-center gap-2 rounded-[6px] bg-album px-2 py-1 text-[12px] leading-none text-white",
        className,
      )}
    >
      <span>{day}</span>
      {time && (
        <>
          <span aria-hidden="true" className="h-3 w-px bg-white/40" />
          <span>{time}</span>
        </>
      )}
    </p>
  );
}

function TeamLine({ club, lead }: { club: Match["homeTeam"]; lead: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ClubLogo club={club} size={lead ? 40 : 32} />
      <span
        className={cn(
          "font-display truncate text-ink",
          lead ? "text-[26px] sm:text-[30px]" : "text-[22px]",
        )}
        title={club.name}
      >
        {club.name}
      </span>
    </div>
  );
}
