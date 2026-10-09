import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchCard } from "@/components/matches/MatchCard";
import { Section, SectionHeader } from "@/components/shared/Section";

/**
 * The homepage's one fixture section.
 *
 * It used to be two — "Popular Matches" and "Upcoming Fixtures" — which drew
 * from the same provider in the same order and so showed the same football
 * twice. This is the merge: the next two fixtures get a larger card, the
 * rest stay scannable at normal size, and one link goes to the full list.
 *
 * Fixtures are whatever the provider returns, in its order. Nothing here is
 * curated or pinned.
 *
 * One way out, not two: the header link is the section's navigation. A
 * second button under the grid pointed at the same place and only made the
 * page longer.
 */
export function PopularMatches({
  matches,
  offersSummaries,
}: {
  matches: Match[];
  offersSummaries: Map<string, CheapestOfferSummary>;
}) {
  const t = useTranslations("Home.popularMatches");

  const [first, second, ...rest] = matches;
  const lead = [first, second].filter(Boolean);

  return (
    <Section>
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Link
            href="/matches"
            className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-medium text-ink transition-colors hover:text-ink-muted"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {lead.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lead.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              variant="lead"
              offersSummary={offersSummaries.get(match.id) ?? null}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              offersSummary={offersSummaries.get(match.id) ?? null}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
