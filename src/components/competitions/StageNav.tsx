import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CompetitionStage, StageCalendarEntry } from "@/types/football";
import { cn } from "@/lib/utils";

/**
 * Moves between the rounds of a staged competition.
 *
 * Every round the organiser has published appears, including the ones that
 * have not been drawn — their dates are confirmed even when their teams are
 * not, and hiding them would make the season look shorter than it is. An
 * undrawn round is marked so the label itself sets the expectation before
 * the user clicks.
 */
export function StageNav({
  stages,
  active,
  basePath,
  query,
}: {
  stages: StageCalendarEntry[];
  active: CompetitionStage;
  /** Locale-relative path, e.g. "/competitions/champions-league". */
  basePath: string;
  /** Other filters to carry across, as plain data. */
  query: Record<string, string | undefined>;
}) {
  const t = useTranslations("Competitions");

  function hrefFor(stage: StageCalendarEntry): string {
    const params = new URLSearchParams({ stage: stage.stage });
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav aria-label={t("stages")} className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex min-w-max gap-2">
        {stages.map((stage) => {
          const isActive = stage.stage === active;
          return (
            <li key={stage.stage}>
              <Link
                href={hrefFor(stage)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-button border px-3.5 text-[14px] transition-colors",
                  isActive
                    ? "border-navy bg-navy text-white"
                    : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                )}
              >
                {t(`stage.${stage.stage}`)}
                {!stage.drawn && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                      isActive ? "bg-white/15 text-white" : "bg-background text-ink-muted",
                    )}
                  >
                    {t("stageUndrawnShort")}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
