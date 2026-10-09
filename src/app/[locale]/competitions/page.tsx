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
 * Country → Competition → fixtures. The first step of the browse path that
 * runs alongside search; every competition here leads to its own fixture
 * list, whether or not those fixtures have tickets on sale.
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

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-10">
        {groups.map((group) => (
          <section key={group.country}>
            <h2 className="mb-4 text-[13px] font-medium uppercase tracking-wider text-ink-muted">
              {tCountries.has(group.country)
                ? tCountries(group.country)
                : group.country}
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.competitions.map((competition) => (
                <Link
                  key={competition.id}
                  href={`/competitions/${competition.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-card border border-border bg-white p-5 transition-colors duration-200 hover:border-border-strong"
                >
                  <span className="flex min-w-0 items-center gap-3.5">
                    <CompetitionLogo competition={competition} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-medium text-ink">
                        {competition.name}
                      </span>
                      <span className="block truncate text-[13px] text-ink-muted">
                        {tCountries.has(competition.country)
                          ? tCountries(competition.country)
                          : competition.country}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
