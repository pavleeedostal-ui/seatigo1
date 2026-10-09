import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Club } from "@/types/football";
import type { PopularitySource } from "@/lib/analytics/club-popularity";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { Section, SectionHeader } from "@/components/shared/Section";

/**
 * The clubs people actually look at on Seatigo, in that order.
 *
 * Two things this component is careful about:
 *
 * 1. It never shows a popularity score. The order is the whole message.
 * 2. It only claims to be measuring when it is. `source` says whether the
 *    order came from real traffic or from the seeded starting list, and the
 *    "Popular" marker and the subtitle both follow it — a seeded list is
 *    never dressed up as data.
 */
export function PopularClubs({
  clubs,
  source,
}: {
  clubs: Club[];
  source: PopularitySource;
}) {
  const t = useTranslations("Home.clubs");
  const tCountries = useTranslations("Countries");
  const measured = source === "traffic";

  return (
    <Section>
      <SectionHeader
        title={t("title")}
        subtitle={measured ? t("subtitleTrending") : t("subtitle")}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {clubs.map((club, index) => (
          <Link
            key={club.id}
            href={`/clubs/${club.slug}`}
            className="group flex min-w-0 items-center gap-3 rounded-card border border-border bg-white px-4 py-3.5 transition-colors duration-200 hover:border-border-strong"
          >
            <ClubLogo club={club} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-ink">
                {club.name}
              </span>
              <span className="block truncate text-[13px] text-ink-muted">
                {tCountries.has(club.country) ? tCountries(club.country) : club.country}
              </span>
            </span>
            {/* Only the leaders carry it: a badge on every tile says nothing. */}
            {measured && index < 3 && (
              <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] leading-[18px] text-ink-muted">
                {t("popular")}
              </span>
            )}
          </Link>
        ))}
      </div>
    </Section>
  );
}
