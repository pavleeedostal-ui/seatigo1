import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { ClubLogo } from "@/components/shared/ClubLogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.clubs" });
  const path = "/clubs";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
  };
}

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Clubs");
  const provider = getFootballDataProvider();
  const clubs = await provider.getClubs();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {clubs.map((club) => (
          <Link
            key={club.id}
            href={`/clubs/${club.slug}`}
            className="group flex flex-col items-center gap-3 rounded-card border border-border bg-white px-5 py-8 text-center transition-colors duration-200 hover:border-border-strong"
          >
            <ClubLogo club={club} size={48} />
            <div>
              <p className="text-[15px] font-medium text-ink">{club.name}</p>
              <p className="text-[13px] text-ink-muted">{club.city}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors group-hover:text-ink">
              {t("viewMatches")}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
