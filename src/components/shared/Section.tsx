import { cn } from "@/lib/utils";

/**
 * Sections are pages of the album: separated by space and by ground, never
 * by boxes. `tone="album"` prints the section on the blue field;
 * `tone="slot"` on white.
 */
export function Section({
  className,
  children,
  id,
  tone = "plain",
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
  tone?: "plain" | "muted" | "slot" | "album";
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-14 sm:py-20 lg:py-24",
        tone === "muted" && "bg-paper-deep",
        tone === "slot" && "bg-slot",
        tone === "album" && "on-album bg-album text-white",
        className,
      )}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

/**
 * A page title in the album's lettering, with an optional supporting line
 * and one action aligned to its baseline.
 */
export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  onAlbum = false,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  onAlbum?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            "font-display text-balance text-[44px] sm:text-[60px] lg:text-[72px]",
            onAlbum ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "mt-3 max-w-xl text-pretty text-[16px] leading-relaxed sm:text-[17px]",
              onAlbum ? "text-album-ink-muted" : "text-ink-muted",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
