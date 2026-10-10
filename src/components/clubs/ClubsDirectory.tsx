"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ClubLogoFallback } from "@/components/shared/ClubLogo";
import { initialOf, normalizeText, NON_ALPHA_GROUP } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * One club as the directory needs it.
 *
 * Flattened on the server so this component never imports the crest
 * registry: `crest` is the resolved file path, and `search` is the
 * pre-normalized haystack (name, short name and every registered alias),
 * which is both smaller to ship than the raw alias lists and guaranteed to
 * have been normalized the same way as the query typed into the box.
 */
export interface DirectoryClub {
  slug: string;
  name: string;
  /** Already localized by the server. */
  country: string;
  crest: string | null;
  search: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * A searchable A–Z directory of every club in the fixture database.
 *
 * Filtering is entirely client-side over data the page already loaded —
 * there is no endpoint behind the search box, because 135 clubs is a few
 * kilobytes and a round trip per keystroke would be slower and worse.
 */
export function ClubsDirectory({ clubs }: { clubs: DirectoryClub[] }) {
  const t = useTranslations("Clubs");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const searchId = useId();

  // Sorted by the name people actually see, with the reader's own collation
  // so Å, Ö and Š land where that language expects them. Ties fall back to
  // the slug so the order never depends on input order.
  const sorted = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    return [...clubs].sort(
      (a, b) => collator.compare(a.name, b.name) || a.slug.localeCompare(b.slug),
    );
  }, [clubs, locale]);

  /** Which buckets exist at all, so empty letters can be disabled. */
  const populated = useMemo(
    () => new Set(sorted.map((club) => initialOf(club.name))),
    [sorted],
  );

  const normalizedQuery = normalizeText(query);

  // Letter and query narrow together: picking M and typing "man" asks for
  // both, not for whichever was chosen last.
  const matches = useMemo(() => {
    return sorted.filter((club) => {
      if (letter && initialOf(club.name) !== letter) return false;
      if (normalizedQuery && !club.search.includes(normalizedQuery)) return false;
      return true;
    });
  }, [sorted, letter, normalizedQuery]);

  /**
   * Grouped under their initial. Clubs keep the order they were sorted in;
   * only the groups are re-ordered, so the numeric bucket sits at the end
   * where the letter row also puts it — a collator would otherwise file
   * "1. FC Köln" ahead of Arsenal.
   */
  const groups = useMemo(() => {
    const byInitial = new Map<string, DirectoryClub[]>();
    for (const club of matches) {
      const key = initialOf(club.name);
      const bucket = byInitial.get(key);
      if (bucket) bucket.push(club);
      else byInitial.set(key, [club]);
    }
    return [...byInitial.entries()].sort(([a], [b]) => {
      if (a === NON_ALPHA_GROUP) return 1;
      if (b === NON_ALPHA_GROUP) return -1;
      return a.localeCompare(b);
    });
  }, [matches]);

  const letters = populated.has(NON_ALPHA_GROUP)
    ? [...LETTERS, NON_ALPHA_GROUP]
    : LETTERS;

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <label htmlFor={searchId} className="sr-only">
            {t("searchLabel")}
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className="h-11 w-full rounded-button border border-border bg-white pl-10 pr-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/20"
          />
        </div>

        {/* Scrolls rather than wrapping on a phone, so the row stays one
            line and the letters keep a predictable position. */}
        <div
          role="group"
          aria-label={t("browseByLetter")}
          className="-mx-5 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
        >
          <div className="flex min-w-max items-center gap-1">
            <LetterButton
              label={t("allLetters")}
              active={letter === null}
              onClick={() => setLetter(null)}
            />
            {letters.map((value) => (
              <LetterButton
                key={value}
                label={value}
                active={letter === value}
                disabled={!populated.has(value)}
                onClick={() => setLetter(value)}
              />
            ))}
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-border px-6 py-16 text-center">
          <p className="text-[17px] font-medium text-ink">{t("noResults")}</p>
          <p className="mt-2 text-[15px] text-ink-muted">{t("noResultsHint")}</p>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {groups.map(([initial, group]) => (
            <section key={initial} aria-labelledby={`${searchId}-${initial}`}>
              <h2
                id={`${searchId}-${initial}`}
                className="mb-4 border-b border-border pb-2 text-[13px] font-medium uppercase tracking-wider text-ink-muted"
              >
                {initial}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {group.map((club) => (
                  <ClubCard key={club.slug} club={club} cta={t("viewMatches")} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function LetterButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-button px-2.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
        active
          ? "bg-navy text-white"
          : disabled
            ? // Still in the row so the alphabet keeps its shape, but plainly
              // not a thing you can press.
              "cursor-not-allowed text-ink-faint"
            : "text-ink-muted hover:bg-background hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function ClubCard({ club, cta }: { club: DirectoryClub; cta: string }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="group flex flex-col items-center gap-3 rounded-card border border-border bg-white px-5 py-8 text-center transition-colors duration-200 hover:border-border-strong"
    >
      {club.crest ? (
        <Image
          src={club.crest}
          alt=""
          aria-hidden="true"
          width={48}
          height={48}
          loading="lazy"
          className="shrink-0 object-contain"
          style={{ width: 48, height: 48 }}
        />
      ) : (
        <ClubLogoFallback size={48} />
      )}
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink">{club.name}</p>
        <p className="text-[13px] text-ink-muted">{club.country}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors group-hover:text-ink">
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
