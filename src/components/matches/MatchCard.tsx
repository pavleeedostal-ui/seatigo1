import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixtureSchedule } from "./FixtureSchedule";
import { FixtureCta, FixturePrice } from "./FixturePrice";
import { cn } from "@/lib/utils";

/**
 * Answers, in order: who is playing, when, where, how much, what to click.
 * Competition appears once, as a quiet label — never repeated as a badge.
 * A fixture with no ticket offers uses the same card, with the price slot
 * and the action label carrying the difference.
 *
 * `variant="lead"` is the same card at a larger size, used for the first one
 * or two fixtures on the homepage. It is a scale change, not a different
 * design — nothing is added that the normal card does not have.
 */
export function MatchCard({
  match,
  offersSummary,
  variant = "default",
  className,
}: {
  match: Match;
  offersSummary?: CheapestOfferSummary | null;
  variant?: "default" | "lead";
  className?: string;
}) {
  const t = useTranslations("Matches");
  const availability = getTicketAvailability(match, Boolean(offersSummary));
  const lead = variant === "lead";

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
        // A query container: a compact four-column card and a wide lead card
        // live at the same viewport width, so only the card's own size can
        // decide whether its footer fits on one line.
        "@container group flex flex-col rounded-card border border-border bg-white transition-colors duration-200 hover:border-border-strong",
        lead ? "p-5 sm:p-6" : "p-5",
        className,
      )}
    >
      <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-muted">
        <CompetitionLogo competition={match.competition} size={20} />
        <span className="truncate">{match.competition.name}</span>
      </p>

      <div className={cn("mt-4 flex flex-col", lead ? "gap-3" : "gap-2.5")}>
        <TeamLine club={match.homeTeam} size={lead ? 44 : 36} lead={lead} />
        <TeamLine club={match.awayTeam} size={lead ? 44 : 36} lead={lead} />
      </div>

      <FixtureSchedule
        match={match}
        showTbc={false}
        className="mt-4 space-y-0.5 text-[13px]"
      />

      {/* Stacked until the card itself is wide enough for price and action
          side by side. Below ~22rem — every four-column card, and every card
          on a phone — the button takes a full row of its own rather than
          being squeezed past the card's edge. */}
      <div className="mt-5 flex flex-col items-stretch gap-3 border-t border-border pt-4 @[22rem]:flex-row @[22rem]:items-end @[22rem]:justify-between">
        <div className="min-w-0">
          <FixturePrice
            availability={availability}
            summary={offersSummary}
            size={lead ? "lead" : "default"}
          />
        </div>

        <FixtureCta availability={availability} className="w-full @[22rem]:w-auto">
          {availability === "available"
            ? t("card.compareTickets")
            : t("card.viewMatch")}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </FixtureCta>
      </div>
    </Link>
  );
}

function TeamLine({
  club,
  size,
  lead,
}: {
  club: Match["homeTeam"];
  size: number;
  lead: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ClubLogo club={club} size={size} />
      <span
        className={cn(
          "truncate font-medium text-ink",
          lead ? "text-[17px]" : "text-[15px]",
        )}
        title={club.name}
      >
        {club.name}
      </span>
    </div>
  );
}
