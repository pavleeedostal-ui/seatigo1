import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchListRow } from "@/components/matches/MatchListRow";
import { Section, SectionHeader } from "@/components/shared/Section";
import { Button } from "@/components/ui/button";

/**
 * The discovery counterpart to Popular Matches: the next fixtures in
 * chronological order, deliberately unfiltered by ticket availability, so
 * the homepage never implies that a match without offers does not exist.
 */
export function UpcomingFixtures({
  matches,
  offersSummaries,
}: {
  matches: Match[];
  offersSummaries: Map<string, CheapestOfferSummary>;
}) {
  const t = useTranslations("Home.upcoming");

  return (
    <Section tone="muted">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <MatchListRow
            key={match.id}
            match={match}
            offersSummary={offersSummaries.get(match.id) ?? null}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="dark">
          <Link href="/matches">
            {t("exploreAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
