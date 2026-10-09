import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function EmptyState({ resetHref }: { resetHref: string }) {
  const t = useTranslations("Matches.empty");

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background">
        <SearchX className="h-6 w-6 text-ink-faint" />
      </div>
      <h3 className="text-[17px] font-medium text-ink">{t("title")}</h3>
      <p className="mt-2 max-w-sm text-[15px] text-ink-muted">{t("description")}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={resetHref}>{t("reset")}</Link>
      </Button>
    </div>
  );
}
