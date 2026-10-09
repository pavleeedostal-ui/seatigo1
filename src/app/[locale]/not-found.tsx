import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-[13px] text-ink-muted">
        404
      </p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] text-ink sm:text-[40px]">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-muted">{t("description")}</p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">{t("cta")}</Link>
      </Button>
    </div>
  );
}
