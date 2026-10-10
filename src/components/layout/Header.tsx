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
 * One header, two settings.
 *
 * On top of the homepage hero it is deliberately bare: logo on the left,
 * utilities on the right, no links in between. The category pills sit
 * directly below the header and carry that navigation, so repeating it
 * beside the logo would be clutter — and the logo gets the room it needs to
 * read as a mark rather than as the first item in a list.
 *
 * The links come back the moment the hero scrolls away, because the pills
 * go with it and a header with no navigation at all would strand anyone
 * halfway down the page. Everywhere else it is the ordinary light header,
 * since the content underneath is white.
 */
/** Roughly the header's own height: past this, the hero is behind it. */
const HERO_HANDOFF_PX = 72;

export function Header() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrollY(window.scrollY);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrolled = scrollY > 4;
  // `usePathname` from the i18n router is already locale-stripped.
  //
  // The switch to the solid header waits until the hero's own height has
  // passed under it, rather than firing on the first pixel of scroll — a
  // white bar sliding across the green on a 4px nudge looks like a glitch.
  const onHero = pathname === "/" && scrollY < HERO_HANDOFF_PX;

  // "How it works" is no longer a destination in the top navigation; it
  // lives in the informational block at the foot of the homepage.
  const navItems = [
    { href: "/matches", label: t("matches") },
    { href: "/competitions", label: t("competitions") },
    { href: "/clubs", label: t("clubs") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors duration-200",
        onHero
          ? "border-transparent bg-transparent"
          : scrolled
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
          <SeatigoLogo size={26} variant={onHero ? "light" : "dark"} />
        </Link>

        <nav
          className={cn(
            "hidden flex-1 items-center gap-7",
            // Hidden only while the hero's own pills are on screen.
            onHero ? "lg:hidden" : "lg:flex",
          )}
          aria-label="Main"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[15px] transition-colors",
                onHero
                  ? "text-hero-ink-muted hover:text-hero-ink"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:gap-3">
          <LanguageSwitcher tone={onHero ? "onDark" : "default"} />

          <Link
            href="/sign-in"
            className={cn(
              "hidden rounded-control px-2 py-1 text-[15px] transition-colors lg:block",
              onHero
                ? "text-hero-ink-muted hover:text-hero-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {t("signIn")}
          </Link>

          <Button
            asChild
            size="sm"
            // Gold on the dark hero, plain white once the header goes
            // solid. Both variants share a box, so the swap is a colour
            // cross-fade and nothing beside it moves.
            variant={onHero ? "gold" : "outline"}
            className="hidden lg:inline-flex"
          >
            <Link href="/matches">{t("findTickets")}</Link>
          </Button>

          <button
            type="button"
            aria-label={t("menu")}
            onClick={() => setMobileOpen(true)}
            className={cn(
              "-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-control transition-colors lg:hidden",
              onHero
                ? "text-hero-ink hover:bg-white/10"
                : "text-ink hover:bg-background",
            )}
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
