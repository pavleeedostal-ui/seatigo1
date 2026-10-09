import { cn } from "@/lib/utils";

/**
 * Seatigo brand marks — from the Claude Design identity ("Seatigo Logo.dc.html").
 *
 * The mark is a stadium seat seen from the side: a vertical pill (the seat
 * back), a horizontal pill (the base), and a dot marking the seat that is
 * yours. Geometry below is the design's percentage layout mapped 1:1 onto a
 * 100x100 viewBox, so it stays vector-sharp at every size.
 *
 * Colors are the design's exact oklch values — do not substitute approximations.
 */

const INK = "oklch(0.22 0.012 70)";
const PAPER = "oklch(0.97 0.01 85)";
const ACCENT = "oklch(0.55 0.12 30)";

export type SeatigoVariant = "dark" | "light" | "mono";

/** `dark` = ink on light backgrounds, `light` = paper on dark, `mono` = single-color. */
function palette(variant: SeatigoVariant) {
  const shape = variant === "light" ? PAPER : INK;
  return { shape, dot: variant === "mono" ? shape : ACCENT };
}

function toLength(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

export function SeatigoMark({
  size = 28,
  variant = "dark",
  title,
  className,
}: {
  size?: number | string;
  variant?: SeatigoVariant;
  /** Give the mark an accessible name when it stands alone; omit when a wordmark or link label already names it. */
  title?: string;
  className?: string;
}) {
  const { shape, dot } = palette(variant);
  const length = toLength(size);

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: length, height: length }}
      className={cn("shrink-0", className)}
      {...(title
        ? { role: "img", "aria-label": title }
        : { "aria-hidden": true, focusable: "false" as const })}
    >
      <rect x="19" y="8" width="20" height="62" rx="10" fill={shape} />
      <rect x="19" y="62" width="62" height="20" rx="10" fill={shape} />
      <circle cx="70.5" cy="26.5" r="10.5" fill={dot} />
    </svg>
  );
}

export function SeatigoWordmark({
  size = 20,
  variant = "dark",
  className,
}: {
  size?: number | string;
  variant?: SeatigoVariant;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontWeight: 600,
        fontSize: toLength(size),
        letterSpacing: "-0.035em",
        lineHeight: 0.9,
        color: variant === "light" ? PAPER : INK,
      }}
    >
      Seatigo
    </span>
  );
}

/**
 * The lockup. `size` is the mark's edge length and everything else derives
 * from it, matching the design's proportions (wordmark 0.68x, gap 0.32x), so
 * a single number keeps the lockup in proportion at any scale. Pass a CSS
 * length (e.g. `clamp(56px, 9vw, 96px)`) for fluid sizing without layout shift.
 */
export function SeatigoLogo({
  variant = "dark",
  size = 28,
  orientation = "horizontal",
  tagline,
  title,
  className,
}: {
  variant?: SeatigoVariant;
  size?: number | string;
  orientation?: "horizontal" | "stacked";
  /** Optional line beneath the wordmark, set in the design's mono/caps treatment. */
  tagline?: string;
  title?: string;
  className?: string;
}) {
  const length = toLength(size);
  const stacked = orientation === "stacked";

  return (
    <span
      className={cn(
        "inline-flex",
        stacked ? "flex-col items-center text-center" : "flex-row items-center",
        className,
      )}
      style={{ gap: `calc(${length} * 0.32)` }}
      {...(title ? { role: "img", "aria-label": title } : {})}
    >
      <SeatigoMark size={size} variant={variant} />
      <span
        className="flex flex-col"
        style={{ gap: `calc(${length} * 0.14)` }}
        aria-hidden={title ? true : undefined}
      >
        <SeatigoWordmark size={`calc(${length} * 0.68)`} variant={variant} />
        {tagline && (
          <span
            className="font-mono uppercase"
            style={{
              // 0.125 is the design's ratio at the large primary lockup; below
              // ~80px that lands under 10px, so the mono caps need a floor.
              fontSize: `max(10px, calc(${length} * 0.125))`,
              letterSpacing: "0.2em",
              color: variant === "light" ? "oklch(0.78 0.015 80)" : "oklch(0.5 0.02 70)",
            }}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
