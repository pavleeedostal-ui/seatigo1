"use client";

import { useTranslations } from "next-intl";
import type { OfferSortKey } from "@/types/ticketing";
import { useRouter, usePathname } from "@/i18n/navigation";
import { buildMatchesQuery, type MatchesSearchState } from "@/lib/matchesUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MatchSortKey = Extract<OfferSortKey, "recommended" | "price_asc" | "best_seats">;

const SORT_KEYS: MatchSortKey[] = ["recommended", "price_asc", "best_seats"];

export function MatchSortSelect({ state }: { state: MatchesSearchState }) {
  const t = useTranslations("Matches.sort");
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(sort: MatchSortKey) {
    router.push(`${pathname}${buildMatchesQuery({ ...state, sort })}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="hidden text-sm text-ink-muted sm:block">{t("label")}</label>
      <Select value={state.sort ?? "recommended"} onValueChange={(v) => handleChange(v as MatchSortKey)}>
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
