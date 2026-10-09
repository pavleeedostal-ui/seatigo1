import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixtureSchedule } from "./FixtureSchedule";
import { FixturePrice } from "./FixturePrice";

/**
 * Search-result row: identity on the left, when/where in the middle, price and
 * action on the right — the three things a comparison scan needs, in that order.
 * Below lg the three blocks stack; the row form needs ~900px to breathe.
 *
 * The row looks the same whether or not tickets are on sale; only the price
 * slot and the action label change.
 */
export function MatchListRow({
  match,
  offersSummary,
  tickets,
}: {
  match: Match;
  offersSummary?: CheapestOfferSummary | null;
  tickets?: string;
}) {
  const t = useTranslations("Matches");
  const availability = getTicketAvailability(match, Boolean(offersSummary));

  return (
    <Link
      href={tickets ? `/matches/${match.slug}?tickets=${tickets}` : `/matches/${match.slug}`}
      // Picked up by the delegated listener in CtaTracker, so counting a
      // ticket click costs this server component no client JavaScript.
      {...(availability === "available"
        ? {
            "data-seatigo-cta": "compare_tickets_click",
            "data-seatigo-clubs": `${match.homeTeam.id},${match.awayTeam.id}`,
            "data-seatigo-fixture": match.id,
          }
        : {})}
      className="group flex flex-col gap-4 rounded-card border border-border bg-white p-5 transition-colors duration-200 hover:border-border-strong lg:flex-row lg:items-center lg:gap-8"
    >
      <div className="min-w-0 lg:w-[340px] lg:shrink-0">
        <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-muted">
          <CompetitionLogo competition={match.competition} size={20} />
          <span className="truncate">{match.competition.name}</span>
        </p>
        {/* Each crest sits immediately before its own club's full name. The
            pair stays on one line and wraps only when the names are too long
            to fit, so nothing is ever abbreviated to save space. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <TeamLine club={match.homeTeam} />
          <span className="text-[15px] text-ink-muted">vs</span>
          <TeamLine club={match.awayTeam} />
        </div>
      </div>

      <FixtureSchedule match={match} showTbc={false} className="min-w-0 flex-1" />

      <div className="flex items-center justify-between gap-5 border-t border-border pt-4 lg:shrink-0 lg:justify-end lg:border-t-0 lg:pt-0">
        <FixturePrice
          availability={availability}
          summary={offersSummary}
          align="right"
        />

        <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-button bg-navy px-4 text-[14px] font-medium text-white transition-colors group-hover:bg-navy-soft">
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
    <span className="inline-flex items-center gap-2">
      <ClubLogo club={club} size={32} />
      <span className="text-[15px] font-medium text-ink">{club.name}</span>
    </span>
  );
}
