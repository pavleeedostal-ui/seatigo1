"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SeatigoLogo } from "@/components/branding/SeatigoLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("Nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/matches", label: t("matches") },
    { href: "/competitions", label: t("competitions") },
    { href: "/clubs", label: t("clubs") },
    { href: "/#how-it-works", label: t("howItWorks") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors duration-200",
        scrolled
          ? "border-border bg-white/85 backdrop-blur-md"
          : "border-transparent bg-white",
      )}
    >
      <div className="container-page flex h-18 items-center gap-8">
        <Link
          href="/"
          aria-label="Seatigo home"
          className="flex items-center rounded-control"
        >
          <SeatigoLogo size={26} />
        </Link>

        <nav
          className="hidden flex-1 items-center gap-7 lg:flex"
          aria-label="Main"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] text-ink-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:gap-3">
          <LanguageSwitcher />

          <Link
            href="/sign-in"
            className="hidden rounded-control px-2 py-1 text-[15px] text-ink-muted transition-colors hover:text-ink lg:block"
          >
            {t("signIn")}
          </Link>

          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/matches">{t("findTickets")}</Link>
          </Button>

          <button
            type="button"
            aria-label={t("menu")}
            onClick={() => setMobileOpen(true)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-background lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        navItems={navItems}
      />
    </header>
  );
}
