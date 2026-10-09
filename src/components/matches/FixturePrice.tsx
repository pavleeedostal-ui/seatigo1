import { useLocale, useTranslations } from "next-intl";
import type { CheapestOfferSummary } from "@/types/ticketing";
import type { TicketAvailability } from "@/lib/fixtures/availability";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The price slot of a match card. Every availability state fills the same
 * slot with the same weight, so a fixture with no offers reads as a normal
 * result rather than a disabled one.
 */
export function FixturePrice({
  availability,
  summary,
  align = "left",
}: {
  availability: TicketAvailability;
  summary: CheapestOfferSummary | null | undefined;
  align?: "left" | "right";
}) {
  const locale = useLocale();
  const t = useTranslations("Matches.card");

  const alignment = align === "right" ? "text-left lg:text-right" : "text-left";

  if (availability === "available" && summary) {
    return (
      <div className={alignment}>
        <p
          className={cn(
            "flex items-baseline gap-1.5",
            align === "right" && "lg:justify-end",
          )}
        >
          <span className="text-[13px] text-ink-muted">{t("from")}</span>
          <span className="text-[22px] font-semibold leading-none tracking-tight text-ink">
            {formatPrice(summary.lowestPrice, summary.currency, locale)}
          </span>
        </p>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          {t("offersCount", { count: summary.offerCount })}
        </p>
      </div>
    );
  }

  return (
    <div className={alignment}>
      <p className="text-[15px] font-medium text-ink">
        {availability === "not_announced" ? t("dateTbc") : t("noOffers")}
      </p>
    </div>
  );
}

/** Label for the card's action, which changes with what the fixture offers. */
export function useFixtureCta(availability: TicketAvailability): string {
  const t = useTranslations("Matches.card");
  return availability === "available" ? t("compareTickets") : t("viewMatch");
}
