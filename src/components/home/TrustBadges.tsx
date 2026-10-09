import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/shared/Section";

export function TrustBadges() {
  const t = useTranslations("Home.trust");

  const items = [
    { title: t("secure"), desc: t("secureDesc") },
    { title: t("verified"), desc: t("verifiedDesc") },
    { title: t("support"), desc: t("supportDesc") },
  ];

  return (
    <Section tone="muted">
      <SectionHeader title={t("title")} />
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
        {items.map((item) => (
          <div key={item.title}>
            <div className="mb-4 h-px w-10 bg-navy" />
            <p className="text-[17px] font-medium text-ink">{item.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
