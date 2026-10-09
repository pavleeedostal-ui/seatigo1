"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type AppLocale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language")}
          className={cn(
            "inline-flex h-11 items-center gap-1.5 rounded-control px-2.5 text-[15px] text-ink-muted transition-colors hover:text-ink lg:h-9",
            className,
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            active={code === locale}
            onSelect={() => {
              // Keep the page *and* its state: next-intl's pathname drops the
              // query, which would reset filters and ticket quantity.
              const search =
                typeof window === "undefined" ? "" : window.location.search;
              router.replace(`${pathname}${search}`, { locale: code });
            }}
          >
            {localeLabels[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
