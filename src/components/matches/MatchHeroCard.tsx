import type { Match } from "@/types/football";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { CompetitionLogo } from "@/components/shared/CompetitionLogo";
import { FixtureSchedule } from "./FixtureSchedule";

/**
 * Fixture header — plain type on the page rather than a nested card, so the
 * comparison list below it stays the visual focus. Renders identically for a
 * fixture with no tickets on sale.
 */
export function MatchHeroCard({ match }: { match: Match }) {
  return (
    <div className="border-b border-border pb-10">
      <p className="flex items-center gap-2 text-[13px] text-ink-muted">
        <CompetitionLogo competition={match.competition} size={24} priority />
        {match.competition.name}
      </p>

      {/* One h1 for the fixture; "vs" takes its own row on mobile so it never
          dangles at the end of the home team's line. */}
      <h1 className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[36px]">
        <span className="flex items-center gap-3">
          <ClubLogo club={match.homeTeam} size={72} priority />
          {match.homeTeam.name}
        </span>
        <span className="w-full text-[15px] font-normal text-ink-muted sm:w-auto">
          vs
        </span>
        <span className="flex items-center gap-3">
          <ClubLogo club={match.awayTeam} size={72} priority />
          {match.awayTeam.name}
        </span>
      </h1>

      <FixtureSchedule match={match} variant="long" />
    </div>
  );
}
