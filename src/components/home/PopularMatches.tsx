import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { MatchCard } from "@/components/matches/MatchCard";
import { Section, SectionHeader } from "@/components/shared/Section";

/**
 * The page after the cover: the fixtures that follow the hero's three
 * stickers, as slots on one album page. The first two are printed larger;
 * the rest keep a scannable four-across rhythm.
 *
 * Fixtures are whatever the provider returns, in its order — soonest
 * first. Nothing is curated, pinned or ranked by popularity, and the
 * heading says so.
 */
export function PopularMatches({
  matches,
  offersSummaries,
  className,
}: {
  matches: Match[];
  offersSummaries: Map<string, CheapestOfferSummary>;
  className?: string;
}) {
  const t = useTranslations("Home.popularMatches");
  if (matches.length === 0) return null;

  return (
    <Section className={className}>
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Link
            href="/matches"
            className="group inline-flex shrink-0 items-center gap-2 border-b-2 border-ink pb-1 text-[15px] font-semibold text-ink transition-colors hover:border-album hover:text-album"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {matches.map((match, i) => (
          <li key={match.id} className={i < 2 ? "sm:col-span-1 lg:col-span-2" : undefined}>
            <MatchCard
              match={match}
              variant={i < 2 ? "lead" : "default"}
              offersSummary={offersSummaries.get(match.id) ?? null}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
