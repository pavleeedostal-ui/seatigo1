"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { AvailabilityFilter } from "@/lib/fixtures/availability";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface CompetitionFiltersValue {
  matchweek?: string;
  team?: string;
  date?: string;
  availability?: AvailabilityFilter;
}

const AVAILABILITY: AvailabilityFilter[] = ["all", "available", "no_offers"];
const AVAILABILITY_KEY: Record<AvailabilityFilter, string> = {
  all: "availabilityAll",
  available: "availabilityAvailable",
  no_offers: "availabilityNone",
};

/**
 * Team, date and ticket-availability filters for one competition. Matchweek
 * lives in its own strip above, so it is not repeated here.
 */
export function CompetitionFilters({
  teams,
  value,
}: {
  teams: { value: string; label: string }[];
  value: CompetitionFiltersValue;
}) {
  const t = useTranslations("Matches.filters");
  const tComp = useTranslations("Competitions");
  const router = useRouter();
  const pathname = usePathname();

  function update(patch: Partial<CompetitionFiltersValue>) {
    const next = { ...value, ...patch };
    const params = new URLSearchParams();
    if (next.matchweek) params.set("matchweek", next.matchweek);
    if (next.team) params.set("team", next.team);
    if (next.date) params.set("date", next.date);
    if (next.availability && next.availability !== "all") {
      params.set("availability", next.availability);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  const hasFilters = Boolean(
    value.team || value.date || (value.availability && value.availability !== "all"),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill
        label={teams.find((o) => o.value === value.team)?.label ?? tComp("team")}
        active={Boolean(value.team)}
        value={value.team ?? "all"}
        onChange={(v) => update({ team: v === "all" ? undefined : v })}
        options={[{ value: "all", label: tComp("allTeams") }, ...teams]}
      />

      <label
        className={cn(
          "relative inline-flex h-9 cursor-pointer items-center rounded-button border px-3.5 text-[14px] transition-colors",
          value.date
            ? "border-navy bg-navy text-white"
            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
        )}
      >
        <span>{value.date || t("date")}</span>
        <input
          type="date"
          value={value.date ?? ""}
          aria-label={t("date")}
          onChange={(e) => update({ date: e.target.value || undefined })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <Pill
        label={
          value.availability && value.availability !== "all"
            ? t(AVAILABILITY_KEY[value.availability])
            : t("availability")
        }
        active={Boolean(value.availability && value.availability !== "all")}
        value={value.availability ?? "all"}
        onChange={(v) => update({ availability: v as AvailabilityFilter })}
        options={AVAILABILITY.map((a) => ({ value: a, label: t(AVAILABILITY_KEY[a]) }))}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            update({ team: undefined, date: undefined, availability: "all" })
          }
          className="inline-flex h-9 items-center gap-1.5 px-2 text-[14px] text-ink-muted transition-colors hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("reset")}
        </button>
      )}
    </div>
  );
}

function Pill({
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
  options: { value: string; label: string }[];
}) {
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
        <span className="max-w-[170px] truncate">{label}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
