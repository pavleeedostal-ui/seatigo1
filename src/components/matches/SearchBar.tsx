"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { buildMatchesQuery } from "@/lib/matchesUrl";
import type { SearchSuggestion, SuggestionKind } from "@/lib/search/suggestions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TICKET_OPTIONS = ["1", "2", "3", "4+"];
const DEBOUNCE_MS = 140;
const MIN_QUERY_LENGTH = 2;

/**
 * One search surface, not three stacked inputs: the fields share a single
 * bordered container and are separated by hairlines rather than their own
 * boxes, so the whole thing reads as a single control.
 *
 * The first field autocompletes across clubs, competitions and cities. A
 * picked suggestion sets the *filter* it stands for (`club`, `competition`,
 * `city`) rather than re-running a free-text search, so choosing "Arsenal"
 * is exact. Typing something with no match still submits as `q`.
 */
export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations("Hero");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [tickets, setTickets] = useState("2");

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Guards against a slow response overwriting a newer one. */
  const requestSeq = useRef(0);

  useEffect(() => {
    const term = query.trim();
    const seq = ++requestSeq.current;
    const controller = new AbortController();

    // Both the clear and the fetch happen on the debounce timer, so a fast
    // typist never gets a render per keystroke.
    const timer = setTimeout(async () => {
      if (term.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: SearchSuggestion[] };
        if (seq !== requestSeq.current) return;
        setSuggestions(data.suggestions);
        setActiveIndex(-1);
      } catch {
        // An aborted or failed lookup just means no suggestions; typing and
        // pressing Enter still works.
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close when focus or a click leaves the whole control.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(state: Parameters<typeof buildMatchesQuery>[0]) {
    setOpen(false);
    router.push(`/matches${buildMatchesQuery({ ...state, date, tickets })}`);
  }

  function choose(suggestion: SearchSuggestion) {
    setQuery(suggestion.label);
    go(
      suggestion.kind === "club"
        ? { club: suggestion.value }
        : suggestion.kind === "competition"
          ? { competition: suggestion.value }
          : { city: suggestion.value },
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Enter on a highlighted suggestion takes it; otherwise free text.
    if (open && activeIndex >= 0 && suggestions[activeIndex]) {
      choose(suggestions[activeIndex]);
      return;
    }
    go({ q: query });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!suggestions.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
    }
  }

  // Guarded on the live query too, so suggestions from a longer previous
  // term never linger under a query that is now too short to search.
  const showList =
    open && query.trim().length >= MIN_QUERY_LENGTH && suggestions.length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col rounded-surface border border-border bg-white p-2 text-left shadow-search sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5">
          <label htmlFor={`${listboxId}-input`} className="text-xs font-medium text-ink-muted">
            {t("searchLabel")}
          </label>
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>

        <div className="mx-4 h-px bg-border sm:mx-0 sm:h-8 sm:w-px" />

        <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-44">
          <span className="text-xs font-medium text-ink-muted">{t("dateLabel")}</span>
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

        <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-28">
          <span className="text-xs font-medium text-ink-muted">{t("ticketsLabel")}</span>
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

        <Button type="submit" size="lg" className="mt-2 w-full sm:ml-1 sm:mt-0 sm:w-auto">
          <Search className="h-4 w-4" />
          {t("searchButton")}
        </Button>
      </form>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("suggestionsLabel")}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[22rem] overflow-y-auto rounded-card border border-border bg-white p-1.5 shadow-pop"
        >
          {suggestions.map((suggestion, index) => (
            <SuggestionRow
              key={`${suggestion.kind}-${suggestion.value}`}
              id={`${listboxId}-opt-${index}`}
              suggestion={suggestion}
              active={index === activeIndex}
              onHover={() => setActiveIndex(index)}
              onSelect={() => choose(suggestion)}
              kindLabel={t(`suggestionKind.${suggestion.kind}` as const)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SuggestionRow({
  id,
  suggestion,
  active,
  onHover,
  onSelect,
  kindLabel,
}: {
  id: string;
  suggestion: SearchSuggestion;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  kindLabel: string;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      // mousedown, not click: the input's blur would otherwise close the
      // list before the click lands.
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 transition-colors",
        active && "bg-background",
      )}
    >
      <SuggestionIcon suggestion={suggestion} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-ink">{suggestion.label}</span>
        <span className="block truncate text-[13px] text-ink-muted">
          {suggestion.hint ? `${kindLabel} · ${suggestion.hint}` : kindLabel}
        </span>
      </span>
    </li>
  );
}

/** A real crest or competition mark where we have one, a city pin otherwise. */
function SuggestionIcon({ suggestion }: { suggestion: SearchSuggestion }) {
  if (suggestion.logo) {
    return (
      <Image
        src={suggestion.logo}
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 object-contain"
      />
    );
  }
  const kind: SuggestionKind = suggestion.kind;
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background">
      {kind === "city" ? (
        <MapPin className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
      ) : (
        <Search className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
      )}
    </span>
  );
}
