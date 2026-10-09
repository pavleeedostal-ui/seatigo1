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
    <div className="rounded-card border border-dashed border-border bg-white px-6 py-10 text-center">
      <p className="text-[13px] font-medium uppercase tracking-wider text-ink-muted">
        {t(`stage.${stage.stage}`)}
      </p>

      <p className="mt-3 text-[22px] font-semibold tracking-[-0.01em] text-ink">
        {t("stageTeamsTbc")}
      </p>

      <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-muted">
        {t("stageTeamsTbcHint")}
      </p>

      <dl className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[14px] text-ink-muted">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <dt className="sr-only">{t("stageDates")}</dt>
          <dd>{window}</dd>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <dt className="sr-only">{t("stageTeamCount")}</dt>
          <dd>
            {t("stageTeams", { count: stage.teamCount })}
            {` · `}
            {stage.legs === 2 ? t("stageTwoLegs") : t("stageOneLeg")}
          </dd>
        </div>

        {stage.stadium && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
            <dt className="sr-only">{t("stageVenue")}</dt>
            <dd>{`${stage.stadium.name} · ${stage.stadium.city}`}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
