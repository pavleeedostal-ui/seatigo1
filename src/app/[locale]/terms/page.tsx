import { getTranslations, setRequestLocale } from "next-intl/server";
import { StaticPage } from "@/components/shared/StaticPage";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("StaticPages.terms");
  return <StaticPage title={t("title")} body={t("body")} />;
}
