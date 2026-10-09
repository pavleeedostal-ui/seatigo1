import { useTranslations } from "next-intl";

/**
 * What the comparison toolbar says about the list underneath it.
 *
 * Deliberately narrow: the lowest price, the seller count and the total
 * offer count all live in the stats block beside the fixture hero, and
 * repeating them here was the same three numbers twice on one screen. This
 * reports only what the hero cannot — how much is on offer *now*, after the
 * filters the user has applied.
 */
export function OffersSummary({
  offerCount,
  sellerCount,
  categoryCount,
}: {
  offerCount: number;
  sellerCount: number;
  categoryCount: number;
}) {
  const t = useTranslations("Offers");

  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <p className="text-[14px] text-ink">
        {t(offerCount === 1 ? "summaryOne" : "summary", {
          count: offerCount,
          sellers: sellerCount,
        })}
      </p>
      {categoryCount > 0 && (
        <p className="text-[14px] text-ink-muted">
          {categoryCount} {t("categoriesLabel").toLowerCase()}
        </p>
      )}
    </div>
  );
}
