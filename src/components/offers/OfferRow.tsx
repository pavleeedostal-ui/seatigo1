"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { TicketOfferWithProvider } from "@/types/ticketing";
import { CATEGORY_COLORS } from "@/components/stadium/StadiumMap";
import { ProviderBadge } from "./ProviderBadge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

/**
 * One offer, read left to right as the decision is made: **who** is selling,
 * **where** you would sit (with the stand's colour from the map), the
 * terms, the **price**, and the action — under which the row says, in
 * plain words, which website the visitor is about to continue to.
 *
 * The lowest price on the list is the one row whose price sits on the foil.
 */
export function OfferRow({
  offer,
  isBestPrice,
}: {
  offer: TicketOfferWithProvider;
  isBestPrice: boolean;
}) {
  const t = useTranslations("Offers");
  const tCategories = useTranslations("Stadium.categories");
  const tDelivery = useTranslations("Offers.delivery");
  const locale = useLocale();

  const minutes = minutesAgo(offer.lastUpdated);

  return (
    <article
      className={cn(
        "sticker relative grid grid-cols-1 gap-4 p-4 sm:p-5",
        "md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-6",
        "xl:grid-cols-[minmax(170px,0.9fr)_minmax(0,1.2fr)_auto_auto]",
        isBestPrice && "outline-2 outline-ink",
      )}
    >
      {isBestPrice && (
        <p className="font-tab absolute -top-2.5 left-4 rounded-[5px] bg-ink px-2 py-1 text-[11px] leading-none text-white">
          {t("bestPrice")}
        </p>
      )}

      {/* Who */}
      <div className="flex min-w-0 items-center gap-3">
        <ProviderBadge provider={offer.provider} size={36} />
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-tight text-ink [overflow-wrap:anywhere]">{offer.provider.name}</p>
          {offer.sponsored && (
            <p className="font-tab mt-0.5 text-[11px] text-ink-muted">{t("sponsored")}</p>
          )}
        </div>
      </div>

      {/* Where, and on what terms */}
      <div className="min-w-0 md:col-start-1 xl:col-start-auto">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-[3px]"
            style={{ backgroundColor: CATEGORY_COLORS[offer.category] }}
          />
          <span className="font-display text-[22px] text-ink">
            {tCategories(`${offer.category}.name`)}
          </span>
        </p>
        <p className="mt-1 text-[14px] text-ink-muted">{offer.section}</p>
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-ink-muted">
          <span>{t("quantityAvailable", { count: offer.quantityAvailable })}</span>
          <span aria-hidden="true">·</span>
          <span>{offer.feesIncluded ? t("feesIncluded") : t("feesExcluded")}</span>
          {offer.deliveryMethod && (
            <>
              <span aria-hidden="true">·</span>
              <span>{tDelivery(offer.deliveryMethod)}</span>
            </>
          )}
        </p>
      </div>

      {/* How much */}
      <div className="flex items-baseline gap-2 md:col-start-2 md:row-span-2 md:row-start-1 md:flex-col md:items-end md:gap-1 xl:col-start-3 xl:row-span-1">
        <p
          className={cn(
            "font-display tabular rounded-[6px] text-[36px] text-ink",
            isBestPrice && "foil px-2 py-0.5",
          )}
        >
          {formatPrice(offer.price, offer.currency, locale)}
        </p>
        <p className="text-[12px] text-ink-muted">
          {t("perTicket")} · {minutes < 1 ? t("updatedNow") : t("updatedMinutes", { minutes })}
        </p>
      </div>

      {/* Where the visitor goes next, said before they go. */}
      <div className="md:col-span-2 xl:col-span-1">
        <a
          href={`/go/${offer.id}`}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          aria-describedby={`${offer.id}-dest`}
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-button bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-album xl:w-auto"
        >
          {t("viewDeal")}
          <ArrowUpRight className="h-4 w-4" />
        </a>
        <p
          id={`${offer.id}-dest`}
          className="mt-1.5 text-center text-[12px] text-ink-muted xl:text-right"
        >
          {t("continuesTo", { seller: offer.provider.name })}
        </p>
      </div>
    </article>
  );
}
