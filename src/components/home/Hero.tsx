import { useTranslations } from "next-intl";
import { HeroBackground } from "./HeroBackground";
import { SearchBar } from "@/components/matches/SearchBar";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative isolate overflow-hidden pb-12 pt-10 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-24">
      <HeroBackground />

      <div className="container-page relative flex flex-col items-center text-center">
        <p className="text-sm text-ink-muted">{t("eyebrow")}</p>

        <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[56px] lg:text-[64px]">
          {t("headline")}
        </h1>

        <p className="mt-4 max-w-lg text-balance text-[17px] leading-relaxed text-ink-muted">
          {t("subtitle")}
        </p>

        <div className="mt-10 w-full max-w-4xl">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
