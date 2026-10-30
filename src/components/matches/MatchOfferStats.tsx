import { useLocale, useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import type { TicketOffer } from "@/types/ticketing";
import { formatPrice } from "@/lib/format";
import { dedupeOffers, sellerCountOf } from "@/lib/ticketing/identity";

/**
 * The market for this fixture as one sticker on the fixture header: where
 * it starts (on the foil — the lowest price is the one shiny sticker of the
 * set), how many offers from how many sellers, and a way down to them.
 *
 * Every number is counted from the offers actually on the page. The
 * component is only rendered when there are offers, so it can never show a
 * zero dressed up as information.
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
    <div className="sticker w-full max-w-sm p-5 text-ink sm:-rotate-[1.5deg] sm:p-6">
      <dl>
        <dt className="font-tab text-[12px] text-ink-muted">{t("lowestPrice")}</dt>
        <dd className="foil mt-2 inline-flex rounded-[8px] px-3 py-1.5">
          <span className="font-display tabular text-[56px] text-ink">
            {formatPrice(lowest.price, lowest.currency, locale)}
          </span>
        </dd>
        <dt className="sr-only">
          {t("offers")} / {t("sellers")}
        </dt>
        <dd className="mt-3 text-[15px] font-medium text-ink-muted">
          {t("market", { count: unique.length, sellers: sellerCount })}
        </dd>
      </dl>
      <a
        href="#offers"
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-button bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-album"
      >
        {t("jump")}
        <ArrowDown className="h-4 w-4" />
      </a>
    </div>
  );
}
