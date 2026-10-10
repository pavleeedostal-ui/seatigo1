import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { buildAlternates, canonicalFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.competitions" });
  const path = "/competitions";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
  };
}

/**
 * Every competition Seatigo covers, two to a row, each leading to its own
 * fixture list — whether or not those fixtures have tickets on sale.
 *
 * The cards used to sit under per-country headings. Five of the six
 * countries have exactly one competition, so at two columns that produced
 * five lone half-width cards with dead space beside them. They are one grid
 * now; the country is still on every card, and the provider's
 * `getCompetitionsByCountry` still supplies the order (domestic countries
 * alphabetically, continental competitions last), so the grouping can come
 * back as headings the moment a country has more than one competition.
 */
export default async function CompetitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Competitions");
  const tCountries = await getTranslations("Countries");
  const provider = getFootballDataProvider();
  const groups = await provider.getCompetitionsByCountry();
  const competitions = groups.flatMap((group) => group.competitions);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">{t("subtitle")}</p>
      </div>

      {/* Two to a row from the tablet breakpoint up, and never more than
          two: these are destinations, not a dense index. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/competitions/${competition.slug}`}
            className="group flex min-h-[7.5rem] items-center justify-between gap-5 rounded-card border border-border bg-white p-6 transition-colors duration-200 hover:border-border-strong hover:bg-background sm:min-h-[8.5rem] sm:gap-6 sm:p-8"
          >
            <span className="flex min-w-0 items-center gap-4 sm:gap-5">
              {/* A fixed box, so every card's logo and title start at the
                  same x however wide the mark is. */}
              <CompetitionLogo competition={competition} size={56} boxWidth={92} />
              <span className="min-w-0">
                {/* No truncation: the card is wide enough that a long name
                    like "UEFA Champions League" reads better wrapped than
                    cut off. */}
                <span className="block text-[19px] font-medium leading-snug tracking-[-0.01em] text-ink sm:text-[22px]">
                  {competition.name}
                </span>
                <span className="mt-1 block text-[14px] text-ink-muted">
                  {tCountries.has(competition.country)
                    ? tCountries(competition.country)
                    : competition.country}
                </span>
              </span>
            </span>

            <ArrowRight className="h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
