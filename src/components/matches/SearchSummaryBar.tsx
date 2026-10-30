"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Search, Calendar, Users, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { buildMatchesQuery, type MatchesSearchState } from "@/lib/matchesUrl";
import { Button } from "@/components/ui/button";

const TICKET_OPTIONS = ["1", "2", "3", "4+"];

export function SearchSummaryBar({ state }: { state: MatchesSearchState }) {
  const t = useTranslations("Matches");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(state.q ?? "");
  const [date, setDate] = useState(state.date ?? "");
  const [tickets, setTickets] = useState(state.tickets ?? "1");

  function summaryText() {
    const parts: string[] = [];
    if (state.q) parts.push(`"${state.q}"`);
    if (state.date) {
      parts.push(
        new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
          new Date(state.date),
        ),
      );
    }
    if (state.tickets) {
      const count = state.tickets === "4+" ? 4 : Number(state.tickets);
      parts.push(t("searchSummary.ticketsCount", { count }));
    }
    return parts.length ? parts.join(" · ") : t("filters.all");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/matches${buildMatchesQuery({ ...state, q, date, tickets })}`);
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-2 rounded-card bg-slot p-2 shadow-sticker sm:flex-row sm:items-center"
      >
        <label className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("title")}
            className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </label>
        <div className="hidden h-7 w-px bg-border sm:block" />
        <label className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left sm:w-44">
          <Calendar className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[16px] text-ink focus:outline-none"
          />
        </label>
        <div className="hidden h-7 w-px bg-border sm:block" />
        <label className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left sm:w-32">
          <Users className="h-4 w-4 shrink-0 text-ink-faint" />
          <select
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            className="w-full appearance-none bg-transparent text-[16px] text-ink focus:outline-none"
          >
            {TICKET_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1 sm:flex-none">
            {t("filters.apply")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("filters.close")}
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-card bg-slot px-5 py-3.5 shadow-sticker">
      <p className="truncate text-[16px] font-semibold text-ink">{summaryText()}</p>
      {/* Icon-only on a phone, where a long label ("Modifier la recherche")
          would leave the summary itself no room. */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
        aria-label={t("searchSummary.editSearch")}
        className="shrink-0 rounded-full max-sm:w-9 max-sm:px-0"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="max-sm:sr-only">{t("searchSummary.editSearch")}</span>
      </Button>
    </div>
  );
}
