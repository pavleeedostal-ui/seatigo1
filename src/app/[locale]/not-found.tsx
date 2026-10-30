import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** A missing page as an empty slot: the number printed, nothing stuck in. */
export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="slot-empty flex w-full max-w-lg flex-col items-center rounded-card px-6 py-14">
        <p className="font-display tabular text-[120px] text-album sm:text-[160px]">404</p>
        <h1 className="font-display mt-2 text-balance text-[40px] text-ink sm:text-[52px]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-md text-[16px] text-ink-muted">{t("description")}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">{t("cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
