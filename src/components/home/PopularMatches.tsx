import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchCard } from "@/components/matches/MatchCard";
import { Section, SectionHeader } from "@/components/shared/Section";

export function PopularMatches({
  matches,
  offersSummaries,
}: {
  matches: Match[];
  offersSummaries: Map<string, CheapestOfferSummary>;
}) {
  const t = useTranslations("Home.popularMatches");

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            offersSummary={offersSummaries.get(match.id) ?? null}
          />
        ))}
      </div>
    </Section>
  );
}
