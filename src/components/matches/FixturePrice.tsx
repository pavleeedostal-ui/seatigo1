import { useLocale, useTranslations } from "next-intl";
import type { CheapestOfferSummary } from "@/types/ticketing";
import type { TicketAvailability } from "@/lib/fixtures/availability";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The price slot of a match card — the single most important thing on it,
 * so the figure itself carries the weight and everything around it stays
 * quiet: a small "From" lead-in and one muted line of offer count.
 *
 * Every availability state fills the same slot, so a fixture with no offers
 * reads as a normal result rather than a disabled one.
 */
export function FixturePrice({
  availability,
  summary,
  align = "left",
  size = "default",
}: {
  availability: TicketAvailability;
  summary: CheapestOfferSummary | null | undefined;
  align?: "left" | "right";
  /** `lead` is used by the one or two featured fixtures on the homepage. */
  size?: "default" | "lead";
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
          <span className="text-[12px] uppercase tracking-wide text-ink-muted">
            {t("from")}
          </span>
          <span
            className={cn(
              "font-semibold leading-none tracking-[-0.02em] text-ink",
              size === "lead" ? "text-[30px]" : "text-[26px]",
            )}
          >
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
      <p className="text-[15px] font-medium text-ink-muted">
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

/**
 * The card-level action. A compact secondary button rather than the page's
 * primary style: there are a dozen of these on a results page, and if each
 * one shouted, none of them would.
 *
 * Deliberately **not** `shrink-0`. It used to be, which is what pushed
 * "Porovnat vstupenky" out through the right edge of the narrow four-column
 * cards: a non-shrinking button plus a non-shrinking price in a fixed row
 * needs more width than a ~284px card has, and the overflow has to go
 * somewhere. The footers that use it now wrap or stack instead, and this
 * caps itself at the container either way.
 */
export function FixtureCta({
  availability,
  className,
  children,
}: {
  availability: TicketAvailability;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        // `whitespace-nowrap` keeps the label on one line; the footer gives
        // it a row of its own when there is not enough width for two.
        "inline-flex h-10 max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-button border px-3.5 text-[14px] font-medium transition-colors duration-200",
        availability === "available"
          ? "border-border-strong text-ink group-hover:border-navy group-hover:bg-navy group-hover:text-white"
          : "border-border text-ink-muted group-hover:border-border-strong group-hover:text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
