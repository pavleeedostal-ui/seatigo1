import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CompetitionStage, Match, StageCalendarEntry } from "@/types/football";
import { getFootballDataProvider } from "@/lib/football";
import { getCheapestOffersForFixtures } from "@/lib/ticketing/aggregator";
import {
  getTicketAvailability,
  matchesAvailabilityFilter,
  type AvailabilityFilter,
} from "@/lib/fixtures/availability";
import { buildAlternates, canonicalFor } from "@/lib/seo";
import { PageHeader } from "@/components/shared/PageHeader";
import { MatchListRow } from "@/components/matches/MatchListRow";
import { MatchweekNav } from "@/components/competitions/MatchweekNav";
import { StageNav } from "@/components/competitions/StageNav";
import { StageCalendarCard } from "@/components/competitions/StageCalendarCard";
import { CompetitionFilters } from "@/components/competitions/CompetitionFilters";
import { Button } from "@/components/ui/button";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";

interface PageParams {
  locale: string;
  slug: string;
}

interface SearchParams {
  stage?: string;
  matchweek?: string;
  team?: string;
  date?: string;
  availability?: AvailabilityFilter;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const competition = await getFootballDataProvider().getCompetitionBySlug(slug);
  if (!competition) return { title: "Seatigo" };

  const t = await getTranslations({ locale, namespace: "Metadata.competition" });
  const path = `/competitions/${slug}`;

  return {
    title: t("title", { competition: competition.name }),
    description: t("description", { competition: competition.name }),
    alternates: {
      canonical: canonicalFor(locale, path),
      languages: buildAlternates(path).languages,
    },
  };
}

/**
 * The stage a staged competition should open on: the one holding the next
 * fixture to be played, falling back to the first round that has been drawn.
 * Opening on an undrawn round would show a calendar card to a user who came
 * looking for tickets.
 */
function defaultStage(
  stages: StageCalendarEntry[],
  upcoming: Match[],
): CompetitionStage {
  return (
    upcoming.find((m) => m.stage)?.stage ??
    stages.find((s) => s.drawn)?.stage ??
    stages[0].stage
  );
}

/**
 * One competition's upcoming fixtures. Completed fixtures stay in the
 * database but never appear here — this is the ticket discovery surface.
 *
 * Two shapes share this page. A domestic league is a flat season navigated
 * by matchweek. A UEFA competition is a sequence of stages, some of which
 * are on the calendar without having been drawn; those render as a dated
 * placeholder rather than as fixtures, because they have no teams yet.
 */
export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const provider = getFootballDataProvider();
  const competition = await provider.getCompetitionBySlug(slug);
  if (!competition) notFound();

  const t = await getTranslations("Competitions");
  const tCountries = await getTranslations("Countries");

  // Everything upcoming in this competition; stage/matchweek/team/date/
  // availability are narrowed below so the navigation always shows the
  // full season rather than only what survives the current filters.
  const [{ matches: allUpcoming }, stages] = await Promise.all([
    provider.getMatches({ competition: slug, pageSize: 1000 }),
    provider.getStageCalendar(slug),
  ]);

  const staged = stages !== null && stages.length > 0;
  const activeStage = staged
    ? ((stages.find((s) => s.stage === sp.stage)?.stage ??
        defaultStage(stages, allUpcoming)) as CompetitionStage)
    : null;
  const activeStageEntry = staged
    ? (stages.find((s) => s.stage === activeStage) ?? null)
    : null;

  // In a staged competition every list below is scoped to the chosen stage,
  // so a league-phase matchday strip never mixes in knockout fixtures.
  const inStage = activeStage
    ? allUpcoming.filter((m) => m.stage === activeStage)
    : allUpcoming;

  const matchweeks = [
    ...new Set(inStage.flatMap((m) => (m.matchweek ? [m.matchweek] : []))),
  ].sort((a, b) => a - b);
  // The week the season is actually in: the one holding the next fixture to
  // be played. Using the lowest remaining week number would land on a single
  // rescheduled straggler from a round that is otherwise finished.
  const currentMatchweek = inStage[0]?.matchweek ?? matchweeks[0] ?? null;
  const season = allUpcoming.find((m) => m.season)?.season ?? null;

  // A league page lands on the matchweek the season is actually in; "all"
  // is an explicit choice, because 380 fixtures is not a useful first screen.
  const activeMatchweek =
    sp.matchweek === "all"
      ? null
      : sp.matchweek
        ? Number(sp.matchweek)
        : currentMatchweek;

  const teams = [
    ...new Map(
      inStage.flatMap((m) => [
        [m.homeTeam.slug, m.homeTeam] as const,
        [m.awayTeam.slug, m.awayTeam] as const,
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  let fixtures = inStage;
  if (activeMatchweek != null && matchweeks.length > 0) {
    fixtures = fixtures.filter((m) => m.matchweek === activeMatchweek);
  }
  if (sp.team) {
    fixtures = fixtures.filter(
      (m) => m.homeTeam.slug === sp.team || m.awayTeam.slug === sp.team,
    );
  }
  if (sp.date) fixtures = fixtures.filter((m) => m.date === sp.date);

  const offersSummaries = await getCheapestOffersForFixtures(fixtures);
  fixtures = fixtures.filter((m) =>
    matchesAvailabilityFilter(
      getTicketAvailability(m, Boolean(offersSummaries.get(m.id))),
      sp.availability,
    ),
  );

  // Nothing has been drawn for this round yet, so there is nothing to filter
  // or price — the round shows as a dated placeholder instead.
  const awaitingDraw = activeStageEntry != null && !activeStageEntry.drawn;

  const carriedQuery = {
    team: sp.team,
    date: sp.date,
    availability:
      sp.availability && sp.availability !== "all" ? sp.availability : undefined,
  };

  const countryName = tCountries.has(competition.country)
    ? tCountries(competition.country)
    : competition.country;

  return (
    <>
      <PageHeader
        breadcrumb={[{ href: "/competitions", label: t("title") }, { label: competition.name }]}
        leading={
          <span className="sticker inline-flex h-28 w-28 items-center justify-center p-4 sm:h-32 sm:w-32 sm:-rotate-[3deg]">
            <CompetitionLogo competition={competition} size={80} priority />
          </span>
        }
        title={competition.name}
        subtitle={
          <>
            {countryName}
            {season && ` · ${t("season", { season })}`}
            {" · "}
            {t("fixtureCount", { count: allUpcoming.length })}
          </>
        }
      />

    <div className="container-page pb-20 pt-8 sm:pb-28 sm:pt-10">
      <div className="flex flex-col gap-4">
        {staged && (
          <StageNav
            stages={stages}
            active={activeStage!}
            basePath={`/competitions/${slug}`}
            query={carriedQuery}
          />
        )}

        {!awaitingDraw && matchweeks.length > 1 && (
          <MatchweekNav
            matchweeks={matchweeks}
            active={activeMatchweek}
            showingAll={activeMatchweek == null}
            basePath={`/competitions/${slug}`}
            query={{ ...carriedQuery, stage: activeStage ?? undefined }}
            round={staged ? "matchday" : "matchweek"}
          />
        )}

        {!awaitingDraw && (
          <CompetitionFilters
            teams={teams.map((c) => ({ value: c.slug, label: c.name }))}
            value={{
              matchweek: sp.matchweek,
              team: sp.team,
              date: sp.date,
              availability: sp.availability,
            }}
          />
        )}
      </div>

      <div className="mt-8">
        {awaitingDraw ? (
          <StageCalendarCard stage={activeStageEntry} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
              <h2 className="font-display text-[44px] text-ink sm:text-[60px]">
                {activeMatchweek != null && matchweeks.length > 0
                  ? t(staged ? "matchday" : "matchweek", { number: activeMatchweek })
                  : t("upcomingFixtures")}
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/matches?competition=${competition.slug}`}>
                  {t("allMatches")}
                </Link>
              </Button>
            </div>

            {fixtures.length === 0 ? (
              <p className="slot-empty rounded-card px-6 py-14 text-center text-[16px] text-ink-muted">
                {t("noFixtures")}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {fixtures.map((match) => (
                  <MatchListRow
                    key={match.id}
                    match={match}
                    offersSummary={offersSummaries.get(match.id) ?? null}
                    showDate
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
