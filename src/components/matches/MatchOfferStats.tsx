import { useLocale, useTranslations } from "next-intl";
import type { TicketOffer } from "@/types/ticketing";
import { formatPrice } from "@/lib/format";
import { dedupeOffers, sellerCountOf } from "@/lib/ticketing/identity";

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

  // The aggregator already drops repeats, but the count is only meaningful
  // if that holds wherever these offers came from — so the rule is applied
  // here too rather than assumed. See lib/ticketing/identity.ts.
  const unique = dedupeOffers(offers);
  if (unique.length === 0) return null;

  const lowest = unique.reduce((min, o) => (o.price < min.price ? o : min), unique[0]);
  const sellerCount = sellerCountOf(unique);

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
          {unique.length}
        </dd>
      </div>
    </dl>
  );
}
