import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFootballDataProvider } from "@/lib/football";
import { CLUB_CRESTS, resolveClubCrest } from "@/lib/football/club-logos";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { normalizeText } from "@/lib/text";
import {
  ClubsDirectory,
  type DirectoryClub,
} from "@/components/clubs/ClubsDirectory";

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

const aliasesBySlug = new Map(CLUB_CRESTS.map((c) => [c.slug, c.aliases]));

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Clubs");
  const tCountries = await getTranslations("Countries");
  const provider = getFootballDataProvider();
  const clubs = await provider.getClubs();

  /**
   * Flattened for the client: the crest resolved to a path, the country
   * already localized, and one pre-normalized haystack per club.
   *
   * The haystack is built here rather than in the browser for two reasons.
   * It keeps the crest and alias registries server-side — shipping 135
   * clubs' alias lists would be several times larger than the strings they
   * collapse into. And it is what makes "Man Utd", "PSG" and "Bayern" find
   * the right club: those are registered aliases, searched but never
   * displayed, so the card always shows the club's own full name.
   */
  const directory: DirectoryClub[] = clubs.map((club) => ({
    slug: club.slug,
    name: club.name,
    country: tCountries.has(club.country) ? tCountries(club.country) : club.country,
    crest: resolveClubCrest(club),
    search: normalizeText(
      [club.name, club.shortName, ...(aliasesBySlug.get(club.slug) ?? [])].join(" "),
    ),
  }));

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">
          {t("directorySubtitle", { count: directory.length })}
        </p>
      </div>

      <ClubsDirectory clubs={directory} />
    </div>
  );
}
