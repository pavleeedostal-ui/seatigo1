import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import { recordClubInterest } from "@/lib/analytics/club-popularity";
import { buildAlternates, canonicalFor } from "@/lib/seo";
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
    <div className="container-page py-10 sm:py-14">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted"
      >
        <Link href="/clubs" className="hover:text-ink">
          {t("backToClubs")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="text-ink">{club.name}</span>
      </nav>

      <div className="flex items-center gap-5 border-b border-border pb-8">
        <ClubLogo club={club} size={80} priority />
        <div className="min-w-0">
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[40px]">
            {club.name}
          </h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {homeVenue ? `${homeVenue.name} · ${homeVenue.city}` : t("stadiumUnknown")}
          </p>
        </div>
      </div>

      {competitions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-ink-muted">
            {t("competitions")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {competitions.map((competition) => (
              <Link
                key={competition.slug}
                href={`/competitions/${competition.slug}`}
                className="inline-flex items-center gap-2 rounded-button border border-border px-3.5 py-2 text-[14px] text-ink transition-colors hover:border-border-strong"
              >
                <CompetitionLogo competition={competition} size={20} />
                {competition.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-6 text-[22px] font-semibold tracking-[-0.01em] text-ink">
          {t("upcomingFixtures")}
        </h2>

        {matches.length === 0 ? (
          <p className="rounded-card border border-dashed border-border px-6 py-14 text-center text-[15px] text-ink-muted">
            {t("noFixtures")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <MatchListRow
                key={match.id}
                match={match}
                offersSummary={offersSummaries.get(match.id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
