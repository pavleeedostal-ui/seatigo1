import { useTranslations } from "next-intl";

/**
 * What a visitor should be able to rely on before trusting a comparison
 * site — each line a description of how Seatigo actually behaves, never a
 * claim it cannot back. Printed beneath "How it works" on the blue field.
 */
export function TrustList() {
  const t = useTranslations("Home.trust");

  const items = [
    { title: t("secure"), desc: t("secureDesc") },
    { title: t("verified"), desc: t("verifiedDesc") },
    { title: t("support"), desc: t("supportDesc") },
  ];

  return (
    <div className="mt-16 border-t border-album-line pt-10 sm:mt-20">
      <h3 className="font-tab text-[13px] text-album-ink-muted">{t("title")}</h3>
      <ul className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-[18px] font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-pretty text-[15px] leading-relaxed text-album-ink-muted">
              {item.desc}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
