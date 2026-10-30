"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { SeatigoLogo } from "@/components/branding/SeatigoLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The album's spine: one blue band across the top of every page.
 *
 * It is the same colour as the homepage hero and as every page header
 * below it, so at rest the header and the page's own title band read as
 * one printed field. Once that field scrolls away the band deepens a step
 * and draws a hairline, so it stays legible over the paper beneath.
 */
export function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/matches", label: t("matches") },
    { href: "/competitions", label: t("competitions") },
    { href: "/clubs", label: t("clubs") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "on-album sticky top-0 z-40 w-full border-b text-album-ink transition-[background-color,border-color] duration-300",
        scrolled
          ? "border-album-line bg-album-deep"
          : "border-transparent bg-album",
      )}
    >
      <div className="container-page flex h-16 items-center gap-8 lg:h-18">
        <Link
          href="/"
          aria-label="Seatigo home"
          className="flex items-center rounded-control"
        >
          <SeatigoLogo size={26} variant="light" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-control px-3 py-2 text-[15px] font-medium transition-colors",
                  active ? "text-album-ink" : "text-album-ink-muted hover:text-album-ink",
                )}
              >
                {item.label}
                {/* Where you are in the album: a signal tab under the link. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full bg-signal transition-opacity lg:-bottom-[17px]",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:gap-2">
          <LanguageSwitcher />

          <Link
            href="/sign-in"
            className="hidden rounded-control px-3 py-2 text-[15px] font-medium text-album-ink-muted transition-colors hover:text-album-ink lg:block"
          >
            {t("signIn")}
          </Link>

          <Button asChild size="sm" variant="light" className="hidden lg:inline-flex">
            <Link href="/matches">{t("findTickets")}</Link>
          </Button>

          <button
            type="button"
            aria-label={t("menu")}
            onClick={() => setMobileOpen(true)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-control text-album-ink transition-colors hover:bg-white/10 lg:hidden"
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
