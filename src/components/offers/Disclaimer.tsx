import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  const t = useTranslations("Offers");

  return (
    <p className={cn("flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {t("disclaimer")}
    </p>
  );
}
