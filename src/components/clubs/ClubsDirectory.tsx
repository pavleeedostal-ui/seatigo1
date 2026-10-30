"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
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
      {/* The album's index tab: search and the alphabet on the blue field,
          held under the header while the pages scroll beneath. */}
      <div className="on-album sticky top-16 z-30 border-b border-album-line bg-album lg:top-18">
        <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative lg:w-80 lg:shrink-0">
            <label htmlFor={searchId} className="sr-only">
              {t("searchLabel")}
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              autoComplete="off"
              className="h-11 w-full rounded-button bg-slot pl-10 pr-3.5 text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-ink-muted focus:outline-none"
            />
          </div>

          {/* Scrolls rather than wrapping on a phone, so the row stays one
              line and the letters keep a predictable position. */}
          <div
            role="group"
            aria-label={t("browseByLetter")}
            className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:min-w-0 lg:flex-1 lg:px-0"
          >
            <div className="flex min-w-max items-center gap-0.5">
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
      </div>

      <div className="container-page pb-20 pt-10 sm:pb-28">
        {matches.length === 0 ? (
          <div className="slot-empty rounded-card px-6 py-16 text-center">
            <p className="font-display text-[36px] text-ink">{t("noResults")}</p>
            <p className="mt-3 text-[16px] text-ink-muted">{t("noResultsHint")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {groups.map(([initial, group]) => (
              <section key={initial} aria-labelledby={`${searchId}-${initial}`}>
                {/* The page's letter, at the scale an album prints it. */}
                <h2
                  id={`${searchId}-${initial}`}
                  className="mb-5 flex items-end gap-4"
                >
                  <span className="font-display text-[64px] leading-[0.8] text-album sm:text-[80px]">
                    {initial}
                  </span>
                  <span aria-hidden="true" className="mb-2 h-px flex-1 bg-line-strong" />
                  <span className="font-tab tabular mb-1 text-[12px] text-ink-muted">{group.length}</span>
                </h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {group.map((club) => (
                    <li key={club.slug}>
                      <ClubCard club={club} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
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
        "font-display inline-flex h-10 min-w-9 shrink-0 items-center justify-center rounded-[6px] px-2 text-[22px] leading-none transition-colors",
        active
          ? "bg-signal text-ink"
          : disabled
            ? // Still in the row so the alphabet keeps its shape, but plainly
              // not a thing you can press.
              "cursor-not-allowed text-white/30"
            : "text-white hover:bg-white/12",
      )}
    >
      {label}
    </button>
  );
}

/**
 * A club as a sticker in the index: crest, name in the album's lettering,
 * country beneath. Peels on hover like every sticker in the album.
 */
function ClubCard({ club }: { club: DirectoryClub }) {
  return (
    <Link href={`/clubs/${club.slug}`} className="group block h-full rounded-card">
      <article className="sticker flex h-full flex-col items-center gap-3 px-3 pb-5 pt-6 text-center">
        {club.crest ? (
          <Image
            src={club.crest}
            alt=""
            aria-hidden="true"
            width={56}
            height={56}
            loading="lazy"
            className="shrink-0 object-contain"
            style={{ width: 56, height: 56 }}
          />
        ) : (
          <ClubLogoFallback size={56} />
        )}
        <div className="min-w-0">
          <p className="font-display text-balance text-[20px] text-ink [overflow-wrap:anywhere] sm:text-[22px]">
            {club.name}
          </p>
          <p className="mt-1.5 text-[13px] text-ink-muted">{club.country}</p>
        </div>
      </article>
    </Link>
  );
}
