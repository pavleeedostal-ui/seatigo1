import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function EmptyState({ resetHref }: { resetHref: string }) {
  const t = useTranslations("Matches.empty");

  return (
    // The empty page of the album: a dashed slot with nothing in it yet,
    // and one way back to the full list.
    <div className="slot-empty flex flex-col items-center justify-center rounded-card px-6 py-20 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep">
        <SearchX className="h-6 w-6 text-ink-muted" />
      </div>
      <h3 className="font-display text-[36px] text-ink">{t("title")}</h3>
      <p className="mt-2 max-w-sm text-[15px] text-ink-muted">{t("description")}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={resetHref}>{t("reset")}</Link>
      </Button>
    </div>
  );
}
