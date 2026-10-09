import { getTranslations, setRequestLocale } from "next-intl/server";
import { StaticPage } from "@/components/shared/StaticPage";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("StaticPages.faq");
  return <StaticPage title={t("title")} body={t("body")} />;
}
