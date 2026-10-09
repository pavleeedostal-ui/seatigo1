"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { TicketOfferWithProvider } from "@/types/ticketing";
import { ProviderBadge } from "./ProviderBadge";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

/**
 * One comparison row: seller, what you get, price, action. Seller branding
 * stays deliberately small — the price is the thing being compared.
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
    <div
      className={cn(
        // Stacks on mobile (seller / meta / price+action); becomes a 3-column
        // comparison row from sm up, where prices align down the list.
        "flex flex-col gap-3 rounded-card border bg-white p-4 transition-colors duration-200 sm:grid sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5",
        isBestPrice ? "border-navy" : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <ProviderBadge provider={offer.provider} size={32} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-ink">
            {offer.provider.name}
          </p>
          {/* Wraps rather than truncates: the section is what a seat
              comparison is actually about. */}
          <p className="text-[13px] leading-snug text-ink-muted">
            {tCategories(`${offer.category}.name`)} · {offer.section}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-muted">
        {isBestPrice && <Badge variant="lime">{t("bestPrice")}</Badge>}
        {offer.sponsored && <Badge variant="outline">{t("sponsored")}</Badge>}
        <span>{t("quantityAvailable", { count: offer.quantityAvailable })}</span>
        <span aria-hidden="true" className="text-ink-faint">
          ·
        </span>
        <span>{offer.feesIncluded ? t("feesIncluded") : t("feesExcluded")}</span>
        {offer.deliveryMethod && (
          <>
            <span aria-hidden="true" className="text-ink-faint">
              ·
            </span>
            <span>{tDelivery(offer.deliveryMethod)}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-[20px] font-semibold leading-none tracking-tight text-ink">
            {formatPrice(offer.price, offer.currency, locale)}
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            {minutes < 1 ? t("updatedNow") : t("updatedMinutes", { minutes })}
          </p>
        </div>
        <a
          href={`/go/${offer.id}`}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          title={t("redirectNotice")}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-button bg-navy px-4 text-[14px] font-medium text-white transition-colors hover:bg-navy-soft"
        >
          {t("viewDeal")}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
