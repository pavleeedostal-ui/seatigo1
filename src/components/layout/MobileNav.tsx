"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type AppLocale } from "@/i18n/routing";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SeatigoLogo } from "@/components/branding/SeatigoLogo";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: { href: string; label: string }[];
}

export function MobileNav({ open, onOpenChange, navItems }: MobileNavProps) {
  const t = useTranslations("Nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function selectLocale(next: AppLocale) {
    router.replace(pathname, { locale: next });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex max-h-[88vh] flex-col pb-8">
        <SheetHeader>
          <SheetTitle>
            <SeatigoLogo size={26} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="border-b border-border py-4 text-[17px] text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            onClick={() => onOpenChange(false)}
            className="border-b border-border py-4 text-[17px] text-ink"
          >
            {t("signIn")}
          </Link>
        </nav>

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
            {t("language")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {locales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => selectLocale(code)}
                className={cn(
                  "rounded-control border px-3 py-3 text-left text-[15px] transition-colors",
                  code === locale
                    ? "border-navy bg-navy text-white"
                    : "border-border text-ink hover:border-border-strong",
                )}
              >
                {localeLabels[code]}
              </button>
            ))}
          </div>
        </div>

        <Button asChild className="mt-8 w-full" size="lg">
          <Link href="/matches" onClick={() => onOpenChange(false)}>
            {t("findTickets")}
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
