import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The title band of a working page: printed on the album blue, continuous
 * with the site header above it, so every page opens like a page of the
 * same album. Title in the album's capitals; one supporting line; optional
 * `leading` artwork (a crest, a competition mark) and `aside` content
 * aligned to the title's baseline. `children` sit below, still on blue.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  leading,
  aside,
  children,
  size = "default",
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Trail back up the album: `[{ href, label }]`, the current page last and unlinked. */
  breadcrumb?: { href?: string; label: string }[];
  leading?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  /** `compact` for static pages, where the title is a label, not a poster. */
  size?: "default" | "compact";
  className?: string;
}) {
  return (
    <div className={cn("on-album bg-album text-white", className)}>
      <div className="container-page pb-10 pt-6 sm:pb-14 sm:pt-10">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-[14px] text-album-ink-muted">
              {breadcrumb.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
            {leading && <div className="shrink-0">{leading}</div>}
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-display text-balance break-words text-white",
                  size === "compact"
                    ? "text-[48px] sm:text-[64px]"
                    : "text-[56px] sm:text-[88px] lg:text-[104px]",
                )}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 max-w-2xl text-pretty text-[16px] leading-relaxed text-album-ink-muted sm:text-[18px]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
