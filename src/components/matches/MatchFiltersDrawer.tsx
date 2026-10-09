"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  MatchFilters,
  type FilterOption,
  type MatchFiltersValue,
} from "./MatchFilters";
import { MatchSortSelect } from "./MatchSortSelect";
import { cn } from "@/lib/utils";

/**
 * Owns the filter sheet for both breakpoints: the compact pill bar opens it via
 * "More filters" on desktop, the toolbar button opens it on mobile.
 */
export interface FiltersOptions {
  competitionOptions: FilterOption[];
  clubOptions: FilterOption[];
  cityOptions: FilterOption[];
  countryOptions: FilterOption[];
  providerOptions: FilterOption[];
}

export function MatchFiltersDrawer({
  options,
  value,
  open,
  onOpenChange,
  showTrigger = true,
}: {
  options: FiltersOptions;
  value: MatchFiltersValue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const t = useTranslations("Matches.filters");

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-button border border-border px-3.5 text-[14px] text-ink transition-colors hover:border-border-strong lg:hidden",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters")}
        </button>
      )}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("filters")}</SheetTitle>
          </SheetHeader>
          <MatchFilters
            {...options}
            value={value}
            layout="panel"
            onClose={() => onOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Small client wrapper so the server page can render the bar + sheet without owning state. */
export function MatchFiltersControls({
  options,
  value,
  resultCount,
}: {
  options: FiltersOptions;
  value: MatchFiltersValue;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const tMatches = useTranslations("Matches");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MatchFiltersDrawer
            options={options}
            value={value}
            open={open}
            onOpenChange={setOpen}
          />
          <p className="whitespace-nowrap text-[14px] text-ink-muted">
            {tMatches("resultsCount", { count: resultCount })}
          </p>
        </div>
        <MatchSortSelect state={value} />
      </div>

      <div className="hidden lg:block">
        <MatchFilters
          {...options}
          value={value}
          layout="bar"
          onMore={() => setOpen(true)}
        />
      </div>
    </div>
  );
}
