"use client";

import { useTranslations } from "next-intl";
import type { OfferSortKey } from "@/types/ticketing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_KEYS: OfferSortKey[] = ["recommended", "price_asc", "price_desc", "best_seats"];

export function SortSelect({
  value,
  onChange,
}: {
  value: OfferSortKey;
  onChange: (value: OfferSortKey) => void;
}) {
  const t = useTranslations("Offers.sort");

  return (
    <div className="flex items-center gap-2">
      <label className="hidden text-sm text-ink-muted sm:block">{t("label")}</label>
      <Select value={value} onValueChange={(v) => onChange(v as OfferSortKey)}>
        <SelectTrigger className="w-[9.5rem] sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
