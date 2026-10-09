import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";

export function OffersSummary({
  offerCount,
  sellerCount,
  categoryCount,
  lowestPrice,
  currency,
}: {
  offerCount: number;
  sellerCount: number;
  categoryCount: number;
  lowestPrice: number | null;
  currency: string | null;
}) {
  const t = useTranslations("Offers");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <p className="text-[14px] text-ink-muted">
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
      {lowestPrice != null && currency && (
        <p className="flex items-baseline gap-1.5">
          <span className="text-[13px] text-ink-muted">{t("lowestPrice")}</span>
          <span className="text-[19px] font-semibold tracking-tight text-ink">
            {formatPrice(lowestPrice, currency, locale)}
          </span>
        </p>
      )}
    </div>
  );
}
