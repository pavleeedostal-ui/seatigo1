import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { recordClubInterest } from "@/lib/analytics/club-popularity";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { PageHeader } from "@/components/shared/PageHeader";
import { MatchListRow } from "@/components/matches/MatchListRow";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";

interface PageParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const club = await getFootballDataProvider().getClubBySlug(slug);
  if (!club) return { title: "Seatigo" };

  const t = await getTranslations({ locale, namespace: "Metadata.club" });
  const path = `/clubs/${slug}`;

  return {
    title: t("title", { club: club.name }),
    description: t("description", { club: club.name }),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
  };
}

/**
 * A club's own page: crest, full name, the competitions it appears in, its
 * verified home venue when we have one, and every upcoming fixture with
 * ticket availability joined in.
 */
export default async function ClubPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const provider = getFootballDataProvider();
  const club = await provider.getClubBySlug(slug);
  if (!club) notFound();

  // Counted by club id, so every spelling of the club's name is one club.
  recordClubInterest({ type: "club_page_view", clubIds: [club.id] });

  const t = await getTranslations("Clubs");
  const { matches } = await provider.getMatches({ club: slug, pageSize: 1000 });
  const offersSummaries = await getCheapestOffersForFixtures(matches);

  // Competitions this club actually appears in, from its own fixtures.
  const competitions = [
    ...new Map(matches.map((m) => [m.competition.slug, m.competition])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  // Only a venue the fixture data actually carries — never a guess.
  const homeVenue =
    matches.find((m) => m.homeTeam.slug === slug && m.stadium)?.stadium ?? null;

  return (
    <>
      {/* The club's team page in the album: crest pressed on as a sticker,
          name at poster scale, home ground, and the competitions it plays. */}
      <PageHeader
        breadcrumb={[{ href: "/clubs", label: t("backToClubs") }, { label: club.name }]}
        leading={
          <span className="sticker inline-flex rounded-full p-4 sm:-rotate-[4deg] sm:p-5">
            <ClubLogo club={club} size={88} priority />
          </span>
        }
        title={club.name}
        subtitle={homeVenue ? `${homeVenue.name} · ${homeVenue.city}` : t("stadiumUnknown")}
      >
        {competitions.length > 0 && (
          <div className="mt-8 border-t border-album-line pt-6">
            <h2 className="font-tab mb-3 text-[12px] text-album-ink-muted">{t("competitions")}</h2>
            <ul className="flex flex-wrap gap-2">
              {competitions.map((competition) => (
                <li key={competition.slug}>
                  <Link
                    href={`/competitions/${competition.slug}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white pl-1.5 pr-4 text-[14px] font-semibold text-ink transition-colors hover:bg-signal"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center">
                      <CompetitionLogo competition={competition} size={22} />
                    </span>
                    {competition.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PageHeader>

      <div className="container-page pb-20 pt-10 sm:pb-28 sm:pt-14">
        <h2 className="font-display mb-8 text-[44px] text-ink sm:text-[60px]">
          {t("upcomingFixtures")}
        </h2>

        {matches.length === 0 ? (
          <p className="slot-empty rounded-card px-6 py-14 text-center text-[16px] text-ink-muted">
            {t("noFixtures")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <MatchListRow
                key={match.id}
                match={match}
                offersSummary={offersSummaries.get(match.id) ?? null}
                showDate
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
