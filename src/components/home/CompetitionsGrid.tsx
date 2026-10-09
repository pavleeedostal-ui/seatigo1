import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Competition } from "@/types/football";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { Section, SectionHeader } from "@/components/shared/Section";

export function CompetitionsGrid({
  competitions,
}: {
  competitions: Competition[];
}) {
  const t = useTranslations("Home.competitions");
  const tCountries = useTranslations("Countries");

  return (
    <Section tone="muted">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/competitions/${competition.slug}`}
            className="group flex items-center gap-3 rounded-card border border-border bg-white p-4 transition-colors duration-200 hover:border-border-strong"
          >
            <CompetitionLogo competition={competition} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-ink">
                {competition.name}
              </span>
              <span className="block truncate text-[13px] text-ink-muted">
                {tCountries.has(competition.country)
                  ? tCountries(competition.country)
                  : competition.country}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Section>
  );
}
