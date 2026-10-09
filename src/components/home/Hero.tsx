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
 * The composition is deliberately flat: pills, headline, search, options.
 * Four things stacked in reading order, left-aligned on desktop so the eye
 * lands on the headline and falls straight into the search field below it.
 */

/** Where the mode pills lead. The homepage search is about matches. */
const MODES = [
  { key: "matches", href: "/matches", active: true },
  { key: "competitions", href: "/competitions", active: false },
  { key: "clubs", href: "/clubs", active: false },
] as const;

/**
 * Shortcuts into the search the hero would otherwise take two steps to
 * reach. Each one is a real filter the results page already supports — no
 * option here promises something the backend cannot do.
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
      className="relative isolate -mt-[73px] overflow-hidden bg-hero pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pb-24"
    >
      <HeroBackground />

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
                    "relative inline-flex h-10 items-center rounded-button px-4 text-[14px] font-medium transition-colors",
                    mode.active
                      ? "bg-surface-warm text-surface-warm-ink"
                      : "border border-hero-line text-hero-ink-muted hover:border-hero-line-strong hover:text-hero-ink",
                  )}
                >
                  {tNav(mode.key)}
                  {mode.active && (
                    <span className="absolute inset-x-4 -bottom-px h-px rounded-full bg-hero-gold" />
                  )}
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

        <div className="mt-8 sm:mt-10">
          <SearchBar tone="hero" />
        </div>

        <ul className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
          {QUICK_OPTIONS.map((option) => (
            <li key={option.key}>
              <Link
                href={option.href}
                className="group inline-flex h-9 items-center gap-1.5 rounded-button border border-hero-line bg-hero-elevated/60 px-3.5 text-[13px] text-hero-ink-muted transition-colors hover:border-hero-line-strong hover:text-hero-ink"
              >
                {t(`quick.${option.key}` as const)}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
