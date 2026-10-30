import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/shared/Section";
import { TrustList } from "./TrustBadges";

/**
 * The album's rules page, printed on the blue field: Search → Compare →
 * Choose → Buy from the seller. The numbers stay because the order is the
 * point — the last step happens on someone else's website, and saying so
 * plainly is the most important trust signal on the page.
 */
export function HowItWorks() {
  const t = useTranslations("Home.howItWorks");

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: t(`step${n}Title` as "step1Title"),
    desc: t(`step${n}Desc` as "step1Desc"),
  }));

  return (
    <Section id="how-it-works" tone="album">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} onAlbum />

      <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {/* The route the four steps sit on, drawn once behind them. */}
        <span
          aria-hidden="true"
          className="absolute left-5 right-5 top-5 hidden h-px border-t-2 border-dashed border-album-line-strong lg:block"
        />
        {steps.map((step) => (
          <li key={step.n} className="relative">
            <span
              aria-hidden="true"
              className={
                step.n === 4
                  ? "font-display tabular relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-signal text-[22px] text-ink"
                  : "font-display tabular relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[22px] text-album"
              }
            >
              {step.n}
            </span>
            <h3 className="font-display mt-5 text-[30px] text-white sm:text-[34px]">{step.title}</h3>
            <p className="mt-3 max-w-xs text-pretty text-[15px] leading-relaxed text-album-ink-muted">
              {step.desc}
            </p>
          </li>
        ))}
      </ol>

      <TrustList />
    </Section>
  );
}
