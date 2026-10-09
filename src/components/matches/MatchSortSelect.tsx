"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpDown, Check } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type MatchSortKey = Extract<
  OfferSortKey,
  "recommended" | "price_asc" | "best_seats"
>;

const SORT_KEYS: MatchSortKey[] = ["recommended", "price_asc", "best_seats"];

/**
 * Sort stays one tap away at every width, but changes form: a dropdown on
 * desktop, a bottom sheet on mobile — matching Filters, so the two controls
 * in the toolbar behave the same way on a phone.
 */
export function MatchSortSelect({ state }: { state: MatchesSearchState }) {
  const t = useTranslations("Matches.sort");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const active = (state.sort ?? "recommended") as MatchSortKey;

  function handleChange(sort: MatchSortKey) {
    setOpen(false);
    router.push(`${pathname}${buildMatchesQuery({ ...state, sort })}`);
  }

  return (
    <>
      {/* Mobile: a button that opens a sheet. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-button border border-border px-3.5 text-[14px] text-ink transition-colors hover:border-border-strong lg:hidden"
      >
        <ArrowUpDown className="h-4 w-4" />
        {t("label")}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("label")}</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col">
            {SORT_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => handleChange(key)}
                  aria-current={key === active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-control px-3 py-3.5 text-left text-[15px] transition-colors",
                    key === active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {t(key)}
                  {key === active && <Check className="h-4 w-4 shrink-0 text-ink" />}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {/* Desktop: the inline dropdown. */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="text-sm text-ink-muted">{t("label")}</span>
        <Select value={active} onValueChange={(v) => handleChange(v as MatchSortKey)}>
          <SelectTrigger className="w-44">
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
    </>
  );
}
