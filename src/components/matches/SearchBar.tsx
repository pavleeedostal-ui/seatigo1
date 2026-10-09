"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { buildMatchesQuery } from "@/lib/matchesUrl";
import {
  SUGGESTION_KIND_ORDER,
  type SearchSuggestion,
  type SuggestionKind,
} from "@/lib/search/suggestions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TICKET_OPTIONS = ["1", "2", "3", "4+"];
const DEBOUNCE_MS = 140;
const MIN_QUERY_LENGTH = 2;
/**
 * "Nothing found" is only worth saying once the query looks finished.
 * Below this, an empty result is just a word the user is still typing.
 */
const MIN_QUERY_LENGTH_FOR_EMPTY_STATE = 4;
/** Never let the panel grow past this, however tall the window is. */
const MAX_PANEL_HEIGHT = 352;
/** Below this it is not worth showing a list at all. */
const MIN_PANEL_HEIGHT = 132;
const PANEL_VIEWPORT_MARGIN = 16;
/** Space between the anchor and the panel. */
const PANEL_GAP = 8;

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
export function SearchBar({
  className,
  /**
   * `hero` is the homepage's deep-green surface: the control becomes warm
   * paper rather than plain white, sits on a heavier shadow so it lifts off
   * the green, and gets a little more height. Everything else about it —
   * fields, autocomplete, keyboard behaviour — is identical.
   */
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "hero";
}) {
  const t = useTranslations("Hero");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [tickets, setTickets] = useState("2");

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** The query the current `suggestions` actually answer. */
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panel, setPanel] = useState({ top: 0, maxHeight: MAX_PANEL_HEIGHT });

  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
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
        setResolvedQuery("");
        setLoading(false);
        setActiveIndex(-1);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: SearchSuggestion[] };
        if (seq !== requestSeq.current) return;
        setSuggestions(data.suggestions);
        setResolvedQuery(term);
        setActiveIndex(-1);
      } catch {
        // An aborted or failed lookup just means no suggestions; typing and
        // pressing Enter still works.
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /**
   * Work out where the panel hangs from, and how tall it may be.
   *
   * Two things make this worth measuring rather than hard-coding.
   *
   * The anchor: above `sm` the form is a single row, so the panel belongs
   * under the whole control. Below it the form stacks into four rows, and
   * hanging the panel off the bottom of *that* puts the suggestions under
   * the Search button, a long way from the text being typed and usually
   * off-screen. On a narrow screen it hangs off the text field instead and
   * overlays the rest of the form.
   *
   * The height: on a phone the software keyboard covers the bottom of the
   * window and `window.innerHeight` does not know it — `visualViewport`
   * does. Without this the list runs under the keyboard and everything
   * below the fold is unreachable. On desktop the measurement is simply
   * large, so the panel keeps its normal maximum and nothing changes.
   */
  const measurePanel = useCallback(() => {
    const root = rootRef.current;
    const field = fieldRef.current;
    if (!root || !field) return;

    // Tailwind's `sm` breakpoint, where the form becomes one row.
    const isRow = window.matchMedia("(min-width: 640px)").matches;
    const rootBox = root.getBoundingClientRect();
    const anchorBottom = isRow ? rootBox.bottom : field.getBoundingClientRect().bottom;

    const viewport = window.visualViewport;
    const viewportBottom = viewport
      ? viewport.offsetTop + viewport.height
      : window.innerHeight;

    const available =
      viewportBottom - anchorBottom - PANEL_GAP - PANEL_VIEWPORT_MARGIN;

    setPanel({
      top: Math.round(anchorBottom - rootBox.top + PANEL_GAP),
      maxHeight: Math.max(
        MIN_PANEL_HEIGHT,
        Math.min(MAX_PANEL_HEIGHT, Math.round(available)),
      ),
    });
  }, []);

  // Re-measured whenever anything that moves the field or shrinks the
  // window happens — opening, the result count changing the panel's
  // content, page scroll, a rotation, or the software keyboard sliding in.
  // Measuring only once on open left the panel at a stale height.
  useEffect(() => {
    if (!open) return;
    measurePanel();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", measurePanel);
    viewport?.addEventListener("scroll", measurePanel);
    window.addEventListener("resize", measurePanel);
    // Capture phase, so a scrolling ancestor counts too, not just the page.
    window.addEventListener("scroll", measurePanel, true);
    return () => {
      viewport?.removeEventListener("resize", measurePanel);
      viewport?.removeEventListener("scroll", measurePanel);
      window.removeEventListener("resize", measurePanel);
      window.removeEventListener("scroll", measurePanel, true);
    };
  }, [open, suggestions.length, loading, measurePanel]);

  // Close when a click lands outside the whole control.
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
    if (showList && activeIndex >= 0 && suggestions[activeIndex]) {
      choose(suggestions[activeIndex]);
      return;
    }
    go({ q: query });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      // Focus stays in the field so typing can continue immediately.
      inputRef.current?.focus();
      return;
    }
    if (!showList) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
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

  const hero = tone === "hero";
  const term = query.trim();
  const longEnough = term.length >= MIN_QUERY_LENGTH;
  const answersCurrentQuery = resolvedQuery === term;
  const showList = open && longEnough && answersCurrentQuery && suggestions.length > 0;
  const showLoading = open && longEnough && loading && suggestions.length === 0;
  const showEmpty =
    open &&
    !loading &&
    answersCurrentQuery &&
    suggestions.length === 0 &&
    term.length >= MIN_QUERY_LENGTH_FOR_EMPTY_STATE;
  const showPanel = showList || showLoading || showEmpty;

  /**
   * Suggestions split into their groups, each carrying the index it has in
   * the flat list — so headings are purely visual and keyboard navigation
   * still walks one continuous sequence.
   */
  const groups = useMemo(() => {
    return SUGGESTION_KIND_ORDER.map((kind) => ({
      kind,
      items: suggestions
        .map((suggestion, index) => ({ suggestion, index }))
        .filter((entry) => entry.suggestion.kind === kind),
    })).filter((group) => group.items.length > 0);
  }, [suggestions]);

  /** Stable per suggestion, not per position, so it survives re-ranking. */
  const optionId = (suggestion: SearchSuggestion) =>
    `${listboxId}-opt-${suggestion.kind}-${suggestion.value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex flex-col rounded-surface text-left sm:flex-row sm:items-center",
          tone === "hero"
            ? "bg-surface-warm p-2.5 shadow-hero-search"
            : "border border-border bg-white p-2 shadow-search",
        )}
      >
        <div ref={fieldRef} className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5">
          <label
            htmlFor={`${listboxId}-input`}
            className={cn(
              "text-xs font-medium",
              hero ? "text-surface-warm-muted" : "text-ink-muted",
            )}
          >
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
            aria-busy={showLoading || undefined}
            aria-activedescendant={
              showList && activeIndex >= 0 && suggestions[activeIndex]
                ? optionId(suggestions[activeIndex])
                : undefined
            }
            className={cn("w-full bg-transparent text-[15px] focus:outline-none", hero ? "text-surface-warm-ink placeholder:text-surface-warm-faint" : "text-ink placeholder:text-ink-faint")}
          />
        </div>

        <div className={cn("mx-4 h-px sm:mx-0 sm:h-8 sm:w-px", hero ? "bg-surface-warm-line" : "bg-border")} />

        <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-44">
          <span className={cn("text-xs font-medium", hero ? "text-surface-warm-muted" : "text-ink-muted")}>{t("dateLabel")}</span>
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
            className={cn("w-full bg-transparent text-[15px] focus:outline-none", hero ? "text-surface-warm-ink placeholder:text-surface-warm-faint" : "text-ink placeholder:text-ink-faint")}
          />
        </label>

        <div className={cn("mx-4 h-px sm:mx-0 sm:h-8 sm:w-px", hero ? "bg-surface-warm-line" : "bg-border")} />

        <label className="flex flex-col gap-0.5 px-4 py-2.5 sm:w-28">
          <span className={cn("text-xs font-medium", hero ? "text-surface-warm-muted" : "text-ink-muted")}>{t("ticketsLabel")}</span>
          <select
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            className={cn("w-full appearance-none bg-transparent text-[15px] focus:outline-none", hero ? "text-surface-warm-ink" : "text-ink")}
          >
            {TICKET_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="submit"
          size="lg"
          variant={tone === "hero" ? "gold" : "primary"}
          className="mt-2 w-full sm:ml-1 sm:mt-0 sm:w-auto"
        >
          <Search className="h-4 w-4" />
          {t("searchButton")}
        </Button>
      </form>

      {showPanel && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 overflow-y-auto overscroll-contain rounded-card border border-border p-1.5 text-left shadow-pop",
            tone === "hero" ? "bg-surface-warm" : "bg-white",
          )}
          style={{ top: panel.top, maxHeight: panel.maxHeight }}
        >
          {showLoading && (
            <p className={cn("flex items-center gap-2.5 px-3 py-3 text-[14px]", hero ? "text-surface-warm-muted" : "text-ink-muted")}>
              <Loader2 className={cn("h-4 w-4 animate-spin", hero ? "text-surface-warm-faint" : "text-ink-faint")} aria-hidden="true" />
              {t("searching")}
            </p>
          )}

          {showEmpty && (
            <p className={cn("px-3 py-3 text-[14px]", hero ? "text-surface-warm-muted" : "text-ink-muted")}>
              {t("noSuggestions", { query: term })}
            </p>
          )}

          <ul
            id={listboxId}
            role="listbox"
            aria-label={t("suggestionsLabel")}
            className={cn(!showList && "hidden")}
          >
            {groups.map((group) => (
              <li key={group.kind} role="presentation">
                <p
                  role="presentation"
                  className={cn("px-3 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wider", hero ? "text-surface-warm-faint" : "text-ink-faint")}
                >
                  {t(`suggestionKind.${group.kind}` as const)}
                </p>
                <ul role="group" aria-label={t(`suggestionKind.${group.kind}` as const)}>
                  {group.items.map(({ suggestion, index }) => (
                    <SuggestionRow
                      key={optionId(suggestion)}
                      id={optionId(suggestion)}
                      suggestion={suggestion}
                      active={index === activeIndex}
                      tone={tone}
                      onHover={() => setActiveIndex(index)}
                      onSelect={() => choose(suggestion)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  id,
  suggestion,
  active,
  tone,
  onHover,
  onSelect,
}: {
  id: string;
  suggestion: SearchSuggestion;
  active: boolean;
  tone: "default" | "hero";
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      // mousedown, not click: the input's blur would otherwise close the
      // list before the click lands. Touch raises mousedown too, so one tap
      // selects on a phone as well.
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 transition-colors",
        active && (tone === "hero" ? "bg-white" : "bg-background"),
      )}
    >
      <SuggestionIcon suggestion={suggestion} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[15px]",
            tone === "hero" ? "text-surface-warm-ink" : "text-ink",
          )}
        >
          {suggestion.label}
        </span>
        {suggestion.hint && (
          <span
            className={cn(
              "block truncate text-[13px]",
              tone === "hero" ? "text-surface-warm-muted" : "text-ink-muted",
            )}
          >
            {suggestion.hint}
          </span>
        )}
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
