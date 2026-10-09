import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/shared/Section";

export function HowItWorks() {
  const t = useTranslations("Home.howItWorks");

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <Section id="how-it-works">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
        {steps.map((step, i) => (
          <div key={step.title}>
            <p className="font-mono text-[13px] text-ink-muted">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-3 text-[17px] font-medium text-ink">{step.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
