import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { StageCalendarEntry } from "@/types/football";
import { formatMatchDateLong } from "@/lib/format";

/**
 * A round that is on the calendar but has not been drawn.
 *
 * This exists so Seatigo can be straight about the difference between two
 * things fans conflate: the round is confirmed, the matchups are not. It
 * shows everything the organiser has actually published — dates, how many
 * teams, one leg or two, and the venue where that is already awarded — and
 * says plainly that the teams are still to be confirmed.
 *
 * It deliberately has no ticket call to action. There is nothing to buy for
 * a match that does not exist yet.
 */
export function StageCalendarCard({ stage }: { stage: StageCalendarEntry }) {
  const locale = useLocale();
  const t = useTranslations("Competitions");

  const window =
    stage.dateFrom === stage.dateTo
      ? formatMatchDateLong(stage.dateFrom, locale)
      : `${formatMatchDateLong(stage.dateFrom, locale)} – ${formatMatchDateLong(stage.dateTo, locale)}`;

  return (
    // The round's slots are printed but empty: dates and format are known,
    // the pairings are not drawn yet, and nothing is invented to fill them.
    <div className="slot-empty rounded-card px-6 py-12 text-center sm:py-16">
      <p className="font-tab text-[12px] text-ink-muted">
        {t(`stage.${stage.stage}`)}
      </p>

      <p className="font-display mt-3 text-balance text-[40px] text-ink sm:text-[52px]">
        {t("stageTeamsTbc")}
      </p>

      <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted">
        {t("stageTeamsTbcHint")}
      </p>

      <dl className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[14px] text-ink-muted">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-album" aria-hidden="true" />
          <dt className="sr-only">{t("stageDates")}</dt>
          <dd>{window}</dd>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-album" aria-hidden="true" />
          <dt className="sr-only">{t("stageTeamCount")}</dt>
          <dd>
            {t("stageTeams", { count: stage.teamCount })}
            {` · `}
            {stage.legs === 2 ? t("stageTwoLegs") : t("stageOneLeg")}
          </dd>
        </div>

        {stage.stadium && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-album" aria-hidden="true" />
            <dt className="sr-only">{t("stageVenue")}</dt>
            <dd>{`${stage.stadium.name} · ${stage.stadium.city}`}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
