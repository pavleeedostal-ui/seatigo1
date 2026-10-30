import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixtureSchedule } from "./FixtureSchedule";
import { SlotTab } from "./MatchCard";

/**
 * The fixture page's first viewport: the match itself, printed on the
 * album blue at poster scale — crests, both names, when and where. The
 * fixture owns this screen whether or not anyone is selling tickets for
 * it; `aside` carries the market summary when there is one.
 */
export function MatchHeroCard({
  match,
  aside,
}: {
  match: Match;
  aside?: React.ReactNode;
}) {
  const t = useTranslations("MatchDetail");

  return (
    <div className="on-album bg-album text-white">
      <div className="container-page pb-12 pt-5 sm:pb-16 sm:pt-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-1.5 text-[14px] text-album-ink-muted"
        >
          <Link href="/" className="hover:text-white">
            {t("breadcrumbHome")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          <Link href={`/competitions/${match.competition.slug}`} className="hover:text-white">
            {match.competition.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          <span aria-current="page" className="text-white">
            {match.homeTeam.name} – {match.awayTeam.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="min-w-0 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <SlotTab match={match} className="bg-white text-album" />
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-album-ink-muted">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  <CompetitionLogo competition={match.competition} size={20} priority />
                </span>
                {match.competition.name}
              </span>
            </div>

            {/* One h1 for the fixture: the two crests, then both names in
                the album's lettering, the "v" set small between them. */}
            <h1 className="mt-7">
              <span className="flex items-center gap-3 sm:gap-4">
                <span className="inline-flex rounded-full bg-white p-2.5 shadow-sticker sm:p-3">
                  <ClubLogo club={match.homeTeam} size={64} priority />
                </span>
                <span className="inline-flex rounded-full bg-white p-2.5 shadow-sticker sm:p-3">
                  <ClubLogo club={match.awayTeam} size={64} priority />
                </span>
              </span>
              <span className="font-display mt-6 block text-balance break-words text-[52px] text-white sm:text-[80px] lg:text-[96px]">
                {match.homeTeam.name}
              </span>
              <span className="font-tab block py-1 text-[14px] text-signal">v</span>
              <span className="font-display block text-balance break-words text-[52px] text-white sm:text-[80px] lg:text-[96px]">
                {match.awayTeam.name}
              </span>
            </h1>

            <FixtureSchedule
              match={match}
              variant="long"
              className="mt-2 text-album-ink-muted [&_*]:text-album-ink-muted"
            />
          </div>

          {aside && <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>}
        </div>
      </div>
    </div>
  );
}
