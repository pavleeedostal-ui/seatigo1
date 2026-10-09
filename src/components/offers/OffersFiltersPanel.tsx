"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import type { SeatCategoryKey, TicketProvider } from "@/types/ticketing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_OFFERS_FILTERS,
  type MaxPriceFilter,
  type OffersFiltersValue,
  type QuantityFilter,
} from "./types";
import { cn } from "@/lib/utils";

const CATEGORY_KEYS: SeatCategoryKey[] = [
  "longside",
  "shortside",
  "behind_goal",
  "premium",
  "hospitality",
];
const QUANTITY_OPTIONS: QuantityFilter[] = ["1", "2", "3", "4+"];
const PRICE_OPTIONS: Exclude<MaxPriceFilter, "any">[] = ["50", "100", "150", "250"];

interface Option {
  value: string;
  label: string;
}

export function OffersFiltersPanel({
  value,
  onChange,
  providers,
  sections,
  layout = "panel",
  onClose,
}: {
  value: OffersFiltersValue;
  onChange: (value: OffersFiltersValue) => void;
  providers: TicketProvider[];
  sections: string[];
  layout?: "bar" | "panel";
  onClose?: () => void;
}) {
  const t = useTranslations("Offers.filters");
  const tCategories = useTranslations("Stadium.categories");

  const hasActiveFilters =
    value.category !== "all" ||
    value.section !== "all" ||
    value.quantity !== "any" ||
    value.providerId !== "all" ||
    value.maxPrice !== "any";

  const categoryOptions: Option[] = [
    { value: "all", label: t("any") },
    ...CATEGORY_KEYS.map((k) => ({ value: k, label: tCategories(`${k}.name`) })),
  ];
  const sectionOptions: Option[] = [
    { value: "all", label: t("any") },
    ...sections.map((s) => ({ value: s, label: s })),
  ];
  const quantityOptions: Option[] = [
    { value: "any", label: t("any") },
    ...QUANTITY_OPTIONS.map((q) => ({
      value: q,
      // "4+" has no exact count, so it keeps the raw label plus the noun.
      label:
        q === "4+"
          ? `4+ ${t("ticketsCount", { count: 4 }).replace(/^\d+\s*/, "")}`
          : t("ticketsCount", { count: Number(q) }),
    })),
  ];
  const priceOptions: Option[] = [
    { value: "any", label: t("any") },
    ...PRICE_OPTIONS.map((p) => ({ value: p, label: `< €${p}` })),
  ];
  const providerOptions: Option[] = [
    { value: "all", label: t("any") },
    ...providers.map((p) => ({ value: p.id, label: p.name })),
  ];

  const fields = [
    {
      key: "category",
      label: t("category"),
      options: categoryOptions,
      selected: value.category,
      active: value.category !== "all",
      onChange: (v: string) =>
        onChange({ ...value, category: v as OffersFiltersValue["category"] }),
    },
    {
      key: "section",
      label: t("section"),
      options: sectionOptions,
      selected: value.section,
      active: value.section !== "all",
      onChange: (v: string) => onChange({ ...value, section: v }),
    },
    {
      key: "quantity",
      label: t("quantity"),
      options: quantityOptions,
      selected: value.quantity,
      active: value.quantity !== "any",
      onChange: (v: string) => onChange({ ...value, quantity: v as QuantityFilter }),
    },
    {
      key: "price",
      label: t("price"),
      options: priceOptions,
      selected: value.maxPrice,
      active: value.maxPrice !== "any",
      onChange: (v: string) => onChange({ ...value, maxPrice: v as MaxPriceFilter }),
    },
    {
      key: "provider",
      label: t("provider"),
      options: providerOptions,
      selected: value.providerId,
      active: value.providerId !== "all",
      onChange: (v: string) => onChange({ ...value, providerId: v }),
    },
  ];

  if (layout === "bar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {fields.map((f) => (
          <Select key={f.key} value={f.selected} onValueChange={f.onChange}>
            <SelectTrigger
              className={cn(
                "h-9 w-auto gap-1.5 rounded-button px-3.5 text-[14px]",
                f.active
                  ? "border-navy bg-navy text-white"
                  : "text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              <span className="max-w-[150px] truncate">
                {f.active
                  ? (f.options.find((o) => o.value === f.selected)?.label ?? f.label)
                  : f.label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_OFFERS_FILTERS)}
            className="inline-flex h-9 items-center gap-1.5 px-2 text-[14px] text-ink-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-[13px] text-ink-muted">{f.label}</span>
            <Select value={f.selected} onValueChange={f.onChange}>
              <SelectTrigger>
                <span className="truncate">
                  {f.options.find((o) => o.value === f.selected)?.label ?? ""}
                </span>
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-border bg-white px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={() => onChange(DEFAULT_OFFERS_FILTERS)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("reset")}
        </Button>
        {onClose && (
          <Button type="button" onClick={onClose}>
            {t("apply")}
          </Button>
        )}
      </div>
    </div>
  );
}
