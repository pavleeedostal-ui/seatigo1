import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/matches/SearchBar";
import { HeroBackground } from "./HeroBackground";
import { cn } from "@/lib/utils";

/**
 * The homepage opening: navigation, a statement, and the search.
 *
 * It is the only deep-green surface in the product. Everything below it is
 * white, which is what gives the hero its weight — the colour does the work
 * of saying "this is Seatigo" once, at the top, instead of being spread
 * thinly over every page.
 *
 * ## The overlap
 *
 * The search surface is the last thing in the hero and deliberately hangs
 * past its bottom edge, so it straddles the line between the dark field and
 * the white page below. Three things make that work:
 *
 * - The section carries **no `overflow-hidden`**. The background layer clips
 *   its own arcs, which is all that ever needed clipping; clipping here
 *   would cut the search bar in half and, worse, trap the autocomplete.
 * - The dark field is **its own layer**, inset from the section's bottom by
 *   the overlap, while a **matching negative bottom margin** pulls the next
 *   section up into that gap. Background and layout move together; a
 *   negative margin alone would not do it, because it shifts the sibling
 *   without moving the hero's own painted edge.
 * - The section is a **`z-10` stacking context**, so the hero — and with it
 *   the autocomplete at `z-50` inside — paints above the section that now
 *   overlaps it.
 *
 * The overlap is smaller on a phone: the stacked search surface is four
 * times taller there, and half of it hanging onto white would read as a
 * mistake rather than as a layer.
 */

/** Where the mode pills lead. The homepage search is about matches. */
const MODES = [
  { key: "matches", href: "/matches", active: true },
  { key: "competitions", href: "/competitions", active: false },
  { key: "clubs", href: "/clubs", active: false },
] as const;

/**
 * Shortcuts past the search box for the three things people most often want.
 * Each one is a real filter the results page already supports — no option
 * here promises something the backend cannot do.
 *
 * They sit *above* the search rather than below it because the search
 * surface has to be the hero's final element for the overlap to work, and
 * because they read as ways in rather than as settings on the box.
 */
const QUICK_OPTIONS = [
  { key: "available", href: "/matches?availability=available" },
  { key: "weekend", href: "/matches?range=weekend" },
  { key: "bestPrices", href: "/matches?sort=price_asc" },
] as const;

export function Hero() {
  const t = useTranslations("Hero");
  const tNav = useTranslations("Nav");

  return (
    <section
      // Pulled up behind the sticky header so the green runs to the very top
      // of the page and the navigation sits *on* the hero rather than above
      // it; the padding puts the content back where it belongs. 73px is the
      // header's h-18 plus the 1px bottom border it keeps in both states so
      // its height never changes as it switches from transparent to solid.
      //
      // The negative bottom margin is the overlap — see the note above, and
      // keep it in step with the next section's top padding on the homepage.
      className="relative z-10 -mt-[73px] -mb-8 pb-0 pt-28 sm:-mb-11 sm:pt-32"
    >
      {/* The dark field, stopping one overlap short of the section's bottom.
          That gap is what the search bar hangs into: the section itself has
          no background, so the next section — pulled up by the matching
          negative margin — shows through behind it. */}
      <div className="absolute inset-x-0 bottom-8 top-0 overflow-hidden bg-hero sm:bottom-11">
        <HeroBackground />
      </div>

      <div className="container-page relative">
        {/* Mode pills. Scrollable on a phone rather than wrapping, so the
            row stays one line and keeps its rhythm. */}
        <nav
          aria-label={t("browseLabel")}
          className="-mx-5 overflow-x-auto px-5 pb-8 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
        >
          <ul className="flex min-w-max items-center gap-2">
            {MODES.map((mode) => (
              <li key={mode.key}>
                <Link
                  href={mode.href}
                  aria-current={mode.active ? "page" : undefined}
                  className={cn(
                    // Height and margins are untouched on purpose: these sit
                    // above the headline, so any vertical change would push
                    // the search surface off its approved position.
                    "relative inline-flex h-10 items-center rounded-full px-4 text-[14px] transition-colors",
                    mode.active
                      ? // Ivory, with a brushed-gold edge rather than a gold
                        // fill — the metal reads as a rim, not as paint.
                        "bg-surface-warm font-medium text-surface-warm-ink ring-1 ring-hero-gold/40"
                      : "border border-hero-line bg-white/[0.02] font-normal text-hero-ink-muted hover:border-hero-line-strong hover:text-hero-ink",
                  )}
                >
                  {tNav(mode.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl">
          <h1 className="text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-hero-ink sm:text-[60px] lg:text-[72px]">
            {t("headline")}
          </h1>

          <p className="mt-4 max-w-2xl text-pretty text-[17px] leading-relaxed text-hero-ink-muted sm:text-[19px]">
            {t("subtitle")}
          </p>
        </div>

        <ul className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7">
          {QUICK_OPTIONS.map((option) => (
            <li key={option.key}>
              <Link
                href={option.href}
                className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] text-hero-ink-faint transition-colors hover:border-hero-line hover:text-hero-ink-muted"
              >
                {t(`quick.${option.key}` as const)}
                <ArrowRight className="h-3 w-3 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Last in the hero, and the only thing allowed past its edge. */}
        <div className="relative z-20 mt-7 sm:mt-8">
          <SearchBar tone="hero" />
        </div>
      </div>
    </section>
  );
}
