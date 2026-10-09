import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchListRow } from "./MatchListRow";

export interface RelatedMatchGroup {
  /** "homeTeam" | "awayTeam" | "competition" — decides the heading. */
  kind: "homeTeam" | "awayTeam" | "competition";
  /** The club or competition the group is about. */
  name: string;
  /** Where "see all" goes. */
  href: string;
  matches: Match[];
}

/**
 * Somewhere to go from a fixture with nothing to compare.
 *
 * A match page with no offers is a dead end otherwise: the fan wanted
 * tickets, there are none, and the page stops. These are real upcoming
 * fixtures for the same two clubs and the same competition — ordinary
 * fixtures rendered in the ordinary row, with their own real availability.
 * Nothing here implies a ticket exists where one does not.
 */
export function RelatedMatches({
  groups,
  offersSummaries,
}: {
  groups: RelatedMatchGroup[];
  offersSummaries: Map<string, CheapestOfferSummary>;
}) {
  const t = useTranslations("MatchDetail.related");
  const populated = groups.filter((group) => group.matches.length > 0);

  if (populated.length === 0) return null;

  return (
    <div className="mt-14 flex flex-col gap-10">
      {populated.map((group) => (
        <section key={`${group.kind}-${group.name}`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
              {t(group.kind, { name: group.name })}
            </h2>
            <Link
              href={group.href}
              className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-ink transition-colors hover:text-ink-muted"
            >
              {t("seeAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {group.matches.map((match) => (
              <MatchListRow
                key={match.id}
                match={match}
                offersSummary={offersSummaries.get(match.id) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
