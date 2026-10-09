import { useTranslations } from "next-intl";
import { HeroBackground } from "./HeroBackground";
import { SearchBar } from "@/components/matches/SearchBar";

/**
 * Headline, one line of context, search. Nothing else.
 *
 * The spacing is deliberately tight for a hero: the search surface is the
 * point of the page, so it sits close enough to the headline to read as one
 * block rather than as a separate section below the fold.
 */
export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative isolate overflow-hidden pb-10 pt-8 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14">
      <HeroBackground />

      <div className="container-page relative flex flex-col items-center text-center">
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[52px] lg:text-[58px]">
          {t("headline")}
        </h1>

        <p className="mt-3 max-w-lg text-balance text-[17px] leading-relaxed text-ink-muted">
          {t("subtitle")}
        </p>

        <div className="mt-7 w-full max-w-4xl sm:mt-8">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
