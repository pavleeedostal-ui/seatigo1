import { useLocale, useTranslations } from "next-intl";
import type { TicketOffer } from "@/types/ticketing";
import { formatPrice } from "@/lib/format";

/**
 * A three-figure read on the market for this fixture, directly under the
 * hero: what it starts at, how many sellers are listing, how many offers
 * there are in total.
 *
 * Every number is counted from the offers actually on the page. There is no
 * placeholder and no estimate — the component is only rendered when there
 * are offers, so it can never show a zero dressed up as information.
 */
export function MatchOfferStats({ offers }: { offers: TicketOffer[] }) {
  const locale = useLocale();
  const t = useTranslations("MatchDetail.stats");

  if (offers.length === 0) return null;

  const lowest = offers.reduce((min, o) => (o.price < min.price ? o : min), offers[0]);
  const sellerCount = new Set(offers.map((o) => o.providerId)).size;

  return (
    <dl className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-5">
      <div>
        <dt className="text-[12px] uppercase tracking-wide text-ink-muted">
          {t("lowestPrice")}
        </dt>
        <dd className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {formatPrice(lowest.price, lowest.currency, locale)}
        </dd>
      </div>

      <div>
        <dt className="text-[12px] uppercase tracking-wide text-ink-muted">
          {t("sellers")}
        </dt>
        <dd className="mt-1 text-[20px] font-medium leading-none tabular-nums text-ink">
          {sellerCount}
        </dd>
      </div>

      <div>
        <dt className="text-[12px] uppercase tracking-wide text-ink-muted">
          {t("offers")}
        </dt>
        <dd className="mt-1 text-[20px] font-medium leading-none tabular-nums text-ink">
          {offers.length}
        </dd>
      </div>
    </dl>
  );
}
