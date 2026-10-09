"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { MatchDateRange } from "@/lib/football";
import type { AvailabilityFilter } from "@/lib/fixtures/availability";
import type { SeatCategoryKey } from "@/types/ticketing";
import { buildMatchesQuery, type MatchesSearchState } from "@/lib/matchesUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MatchFiltersValue = MatchesSearchState;

const RANGE_OPTIONS: MatchDateRange[] = ["all", "weekend", "next7", "month"];
const CATEGORY_KEYS: SeatCategoryKey[] = [
  "longside",
  "shortside",
  "behind_goal",
  "premium",
  "hospitality",
];
const PRICE_OPTIONS = ["50", "100", "150", "250"];
const AVAILABILITY_OPTIONS: AvailabilityFilter[] = ["all", "available", "no_offers"];
const AVAILABILITY_LABEL_KEY: Record<AvailabilityFilter, string> = {
  all: "availabilityAll",
  available: "availabilityAvailable",
  no_offers: "availabilityNone",
};

export interface FilterOption {
  value: string;
  label: string;
  /**
   * Optional logo, resolved on the server so this client component never
   * imports the logo registry. Rendered before the label at 20px.
   */
  logo?: string;
}

interface MatchFiltersProps {
  competitionOptions: FilterOption[];
  clubOptions: FilterOption[];
  cityOptions: FilterOption[];
  countryOptions: FilterOption[];
  providerOptions: FilterOption[];
  value: MatchFiltersValue;
  /** `bar` is the compact desktop pill row; `panel` is the full labelled form used inside the sheet. */
  layout?: "bar" | "panel";
  onMore?: () => void;
  onClose?: () => void;
}

export function MatchFilters({
  competitionOptions,
  clubOptions,
  cityOptions,
  countryOptions,
  providerOptions,
  value,
  layout = "panel",
  onMore,
  onClose,
}: MatchFiltersProps) {
  const t = useTranslations("Matches.filters");
  const tOffers = useTranslations("Offers.filters");
  const tCategories = useTranslations("Stadium.categories");
  const router = useRouter();
  const pathname = usePathname();

  function updateParams(patch: Partial<MatchFiltersValue>) {
    router.push(`${pathname}${buildMatchesQuery({ ...value, ...patch })}`);
  }

  function reset() {
    router.push(pathname);
    onClose?.();
  }

  const hasActiveFilters = Boolean(
    value.competition ||
      value.club ||
      value.city ||
      value.country ||
      (value.availability && value.availability !== "all") ||
      value.date ||
      value.maxPrice ||
      value.category ||
      value.provider ||
      (value.range && value.range !== "all"),
  );

  const competitionLabel =
    competitionOptions.find((o) => o.value === value.competition)?.label ??
    t("competition");
  const clubLabel =
    clubOptions.find((o) => o.value === value.club)?.label ?? t("club");
  const priceLabel = value.maxPrice ? `< €${value.maxPrice}` : t("price");
  const availabilityActive = Boolean(
    value.availability && value.availability !== "all",
  );
  const availabilityLabel = availabilityActive
    ? t(AVAILABILITY_LABEL_KEY[value.availability!])
    : t("availability");
  // Filters that live only in the sheet still need to be visible as active,
  // otherwise a narrowed result set looks unexplained.
  const hiddenActiveCount = [
    value.country,
    value.city,
    value.category,
    value.provider,
    value.range && value.range !== "all" ? value.range : undefined,
  ].filter(Boolean).length;

  const availabilityOptions = AVAILABILITY_OPTIONS.map((option) => ({
    value: option,
    label: t(AVAILABILITY_LABEL_KEY[option]),
  }));

  const rangeChips = (
    <div className="flex flex-wrap gap-2">
      {RANGE_OPTIONS.map((range) => {
        const active = (value.range ?? "all") === range;
        return (
          <button
            key={range}
            type="button"
            onClick={() => updateParams({ range })}
            className={cn(
              "h-9 rounded-button border px-3.5 text-[14px] transition-colors",
              active
                ? "border-navy bg-navy text-white"
                : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
            )}
          >
            {/* The date range's "all" is "Any date", so it never reads the
                same as the ticket-availability filter's "All matches". */}
            {range === "all" ? t("anyDate") : t(range)}
          </button>
        );
      })}
    </div>
  );

  if (layout === "bar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <DatePill
          label={t("date")}
          value={value.date ?? ""}
          onChange={(v) => updateParams({ date: v || undefined })}
        />

        <FilterPill
          label={competitionLabel}
          active={Boolean(value.competition)}
          value={value.competition ?? "all"}
          onChange={(v) => updateParams({ competition: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: t("allCompetitions") },
            ...competitionOptions,
          ]}
        />

        <FilterPill
          label={clubLabel}
          active={Boolean(value.club)}
          value={value.club ?? "all"}
          onChange={(v) => updateParams({ club: v === "all" ? undefined : v })}
          options={[{ value: "all", label: t("allClubs") }, ...clubOptions]}
        />

        <FilterPill
          label={priceLabel}
          active={Boolean(value.maxPrice)}
          value={value.maxPrice ?? "all"}
          onChange={(v) => updateParams({ maxPrice: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: t("any") },
            ...PRICE_OPTIONS.map((p) => ({ value: p, label: `< €${p}` })),
          ]}
        />

        <FilterPill
          label={availabilityLabel}
          active={availabilityActive}
          value={value.availability ?? "all"}
          onChange={(v) =>
            updateParams({ availability: v as AvailabilityFilter })
          }
          options={availabilityOptions}
        />

        {onMore && (
          <button
            type="button"
            onClick={onMore}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-button border px-3.5 text-[14px] transition-colors",
              hiddenActiveCount > 0
                ? "border-navy bg-navy text-white"
                : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("more")}
            {hiddenActiveCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[12px] font-medium tabular-nums">
                {hiddenActiveCount}
              </span>
            )}
          </button>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
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
    <div className="flex flex-col gap-6">
      {rangeChips}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("competition")}>
          <PanelSelect
            value={value.competition ?? "all"}
            onChange={(v) => updateParams({ competition: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: t("allCompetitions") },
              ...competitionOptions,
            ]}
          />
        </Field>

        <Field label={t("club")}>
          <PanelSelect
            value={value.club ?? "all"}
            onChange={(v) => updateParams({ club: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: t("allClubs") },
              ...clubOptions,
            ]}
          />
        </Field>

        <Field label={t("location")}>
          <PanelSelect
            value={value.city ?? "all"}
            onChange={(v) => updateParams({ city: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: t("allLocations") },
              ...cityOptions,
            ]}
          />
        </Field>

        <Field label={t("country")}>
          <PanelSelect
            value={value.country ?? "all"}
            onChange={(v) => updateParams({ country: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: t("allCountries") },
              ...countryOptions,
            ]}
          />
        </Field>

        <Field label={t("availability")}>
          <PanelSelect
            value={value.availability ?? "all"}
            onChange={(v) => updateParams({ availability: v as AvailabilityFilter })}
            options={availabilityOptions}
          />
        </Field>

        <Field label={t("date")}>
          {/* Same trick as the hero search: reads as "Choose date" until focused. */}
          <input
            type={value.date ? "date" : "text"}
            value={value.date ?? ""}
            placeholder={t("datePlaceholder")}
            onFocus={(e) => {
              e.currentTarget.type = "date";
              e.currentTarget.showPicker?.();
            }}
            onBlur={(e) => {
              if (!e.currentTarget.value) e.currentTarget.type = "text";
            }}
            onChange={(e) => updateParams({ date: e.target.value || undefined })}
            className="h-11 w-full rounded-control border border-border bg-white px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-navy focus:outline-none"
          />
        </Field>

        <Field label={t("price")}>
          <PanelSelect
            value={value.maxPrice ?? "all"}
            onChange={(v) => updateParams({ maxPrice: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: t("any") },
              ...PRICE_OPTIONS.map((p) => ({ value: p, label: `< €${p}` })),
            ]}
          />
        </Field>

        <Field label={tOffers("category")}>
          <PanelSelect
            value={value.category ?? "all"}
            onChange={(v) => updateParams({ category: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: tOffers("any") },
              ...CATEGORY_KEYS.map((k) => ({
                value: k,
                label: tCategories(`${k}.name`),
              })),
            ]}
          />
        </Field>

        <Field label={tOffers("provider")}>
          <PanelSelect
            value={value.provider ?? "all"}
            onChange={(v) => updateParams({ provider: v === "all" ? undefined : v })}
            options={[
              { value: "all", label: tOffers("any") },
              ...providerOptions,
            ]}
          />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-border bg-white px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={!hasActiveFilters}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function PanelSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <OptionLabel option={selected} className="truncate" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <OptionLabel option={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A filter option with its logo, when it has one. */
function OptionLabel({
  option,
  className,
}: {
  option?: FilterOption;
  className?: string;
}) {
  if (!option) return <span className={className} />;
  if (!option.logo) return <span className={className}>{option.label}</span>;
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <Image
        src={option.logo}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 object-contain"
      />
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function FilterPill({
  label,
  active,
  value,
  onChange,
  options,
}: {
  label: string;
  active: boolean;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  const selectedLogo = active
    ? options.find((o) => o.value === value)?.logo
    : undefined;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-9 w-auto gap-1.5 rounded-button px-3.5 text-[14px]",
          active
            ? "border-navy bg-navy text-white"
            : "text-ink-muted hover:border-border-strong hover:text-ink",
        )}
      >
        {selectedLogo && (
          <Image
            src={selectedLogo}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            className="h-[18px] w-[18px] shrink-0 object-contain"
          />
        )}
        <span className="max-w-[160px] truncate">{label}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <OptionLabel option={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DatePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex h-9 cursor-pointer items-center rounded-button border px-3.5 text-[14px] transition-colors",
        value
          ? "border-navy bg-navy text-white"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      <span>{value || label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}
