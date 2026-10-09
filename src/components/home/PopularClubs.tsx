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

      {/* Compact navigation, not a card wall: two columns on a phone, up to
          six on a wide desktop, so twelve clubs read as one tidy block. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {clubs.map((club, index) => (
          <Link
            key={club.id}
            href={`/clubs/${club.slug}`}
            className="group flex min-w-0 items-center gap-2.5 rounded-control border border-border bg-white px-3 py-2.5 transition-colors duration-200 hover:border-border-strong"
          >
            <ClubLogo club={club} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink">
                {club.name}
              </span>
              <span className="block truncate text-[12px] text-ink-muted">
                {tCountries.has(club.country) ? tCountries(club.country) : club.country}
              </span>
            </span>
            {/* Only the leaders carry it, and as a dot rather than a chip:
                at six columns a text badge would crowd out the club name. */}
            {measured && index < 3 && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime-dark"
                title={t("popular")}
              >
                <span className="sr-only">{t("popular")}</span>
              </span>
            )}
          </Link>
        ))}
      </div>
    </Section>
  );
}
