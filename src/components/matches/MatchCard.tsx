import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixtureSchedule } from "./FixtureSchedule";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Answers, in order: who is playing, when, where, how much, what to click.
 * Competition appears once, as a quiet label — never repeated as a badge.
 * A fixture with no ticket offers uses the same card, with the price slot
 * saying so; it is a normal result, not a disabled one.
 */
export function MatchCard({
  match,
  offersSummary,
  className,
}: {
  match: Match;
  offersSummary?: CheapestOfferSummary | null;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Matches");
  const availability = getTicketAvailability(match, Boolean(offersSummary));

  return (
    <Link
      href={`/matches/${match.slug}`}
      // Picked up by the delegated listener in CtaTracker, so counting a
      // ticket click costs this server component no client JavaScript.
      {...(availability === "available"
        ? {
            "data-seatigo-cta": "compare_tickets_click",
            "data-seatigo-clubs": `${match.homeTeam.id},${match.awayTeam.id}`,
            "data-seatigo-fixture": match.id,
          }
        : {})}
      className={cn(
        "group flex flex-col rounded-card border border-border bg-white p-5 transition-colors duration-200 hover:border-border-strong",
        className,
      )}
    >
      <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-muted">
        <CompetitionLogo competition={match.competition} size={20} />
        <span className="truncate">{match.competition.name}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <TeamLine club={match.homeTeam} />
        <TeamLine club={match.awayTeam} />
      </div>

      <FixtureSchedule match={match} showTbc={false} className="mt-4 space-y-0.5 text-[13px]" />

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
        {availability === "available" && offersSummary ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-[13px] text-ink-muted">{t("card.from")}</span>
            <span className="text-[19px] font-semibold leading-none tracking-tight text-ink">
              {formatPrice(offersSummary.lowestPrice, offersSummary.currency, locale)}
            </span>
          </p>
        ) : (
          <p className="text-[13px] text-ink-muted">
            {availability === "not_announced"
              ? t("card.dateTbc")
              : t("card.noOffers")}
          </p>
        )}

        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink">
          {availability === "available"
            ? t("card.compareTickets")
            : t("card.viewMatch")}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function TeamLine({ club }: { club: Match["homeTeam"] }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ClubLogo club={club} size={36} />
      <span className="truncate text-[15px] font-medium text-ink" title={club.name}>
        {club.name}
      </span>
    </div>
  );
}
