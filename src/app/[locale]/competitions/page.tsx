import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { PageHeader } from "@/components/shared/PageHeader";
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
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="container-page pb-20 pt-10 sm:pb-28 sm:pt-14">
        {/* Two to a row from the tablet breakpoint up, and never more than
            two: these are destinations, not a dense index. Each is a large
            sticker — the competition's badge page in the album. */}
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Link
                href={`/competitions/${competition.slug}`}
                className="group block h-full rounded-card"
              >
                <article className="sticker flex h-full min-h-[8.5rem] items-center gap-5 p-5 sm:min-h-[10rem] sm:gap-7 sm:p-7">
                  {/* A fixed box, so every card's logo and title start at the
                      same x however wide the mark is. */}
                  <span className="flex h-20 w-24 shrink-0 items-center justify-center rounded-[10px] bg-paper sm:h-24 sm:w-28">
                    <CompetitionLogo competition={competition} size={56} boxWidth={84} />
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* No truncation: a long name like "UEFA Champions
                        League" reads better wrapped than cut off. */}
                    <span className="font-display block text-balance text-[30px] text-ink sm:text-[38px]">
                      {competition.name}
                    </span>
                    <span className="mt-2 block text-[14px] text-ink-muted">
                      {tCountries.has(competition.country)
                        ? tCountries(competition.country)
                        : competition.country}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors group-hover:bg-album"
                  >
                    <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
