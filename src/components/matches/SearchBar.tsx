"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { buildMatchesQuery } from "@/lib/matchesUrl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TICKET_OPTIONS = ["1", "2", "3", "4+"];

/**
 * One search surface, not three stacked inputs: fields share a single
 * bordered container and are separated by hairlines rather than their own
 * boxes, so the whole thing reads as a single control.
 */
export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations("Hero");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [tickets, setTickets] = useState("2");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/matches${buildMatchesQuery({ q: query, date, tickets })}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col rounded-surface border border-border bg-white p-2 text-left shadow-search sm:flex-row sm:items-center",
        className,
      )}
    >
      <label className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5">
        <span className="text-xs font-medium text-ink-muted">
          {t("searchLabel")}
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </label>

      <div className="mx-4 h-px bg-border sm:mx-0 sm:h-8 sm:w-px" />

      <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-44">
        <span className="text-xs font-medium text-ink-muted">
          {t("dateLabel")}
        </span>
        {/* Starts as text so the field reads "Choose date" instead of the
            browser's dd.mm.yyyy mask; becomes a real date input on focus. */}
        <input
          type="text"
          value={date}
          placeholder={t("datePlaceholder")}
          onFocus={(e) => {
            e.currentTarget.type = "date";
            e.currentTarget.showPicker?.();
          }}
          onBlur={(e) => {
            if (!e.currentTarget.value) e.currentTarget.type = "text";
          }}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </label>

      <div className="mx-4 h-px bg-border sm:mx-0 sm:h-8 sm:w-px" />

      <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-32">
        <span className="text-xs font-medium text-ink-muted">
          {t("ticketsLabel")}
        </span>
        <select
          value={tickets}
          onChange={(e) => setTickets(e.target.value)}
          className="w-full appearance-none bg-transparent text-[15px] text-ink focus:outline-none"
        >
          {TICKET_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" className="mt-2 w-full sm:mt-0 sm:w-auto">
        {t("searchButton")}
      </Button>
    </form>
  );
}
