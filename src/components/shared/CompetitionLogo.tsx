import Image from "next/image";
import type { Competition } from "@/types/football";
import { resolveCompetitionLogo } from "@/lib/football/competition-logos";
import { cn } from "@/lib/utils";

/** A wordmark may be up to this many times wider than it is tall. */
const MAX_ASPECT = 2.6;

/**
 * A competition's real logo at a fixed height, with width free to follow the
 * artwork's own aspect ratio up to MAX_ASPECT.
 *
 * Competition logos are a mix of near-square crests (Champions League,
 * Bundesliga) and wide wordmarks (LALIGA EA SPORTS is 161x55). Forcing both
 * into a square box would shrink every wordmark to illegibility, so the fixed
 * dimension is height — which is what keeps a list visually aligned — and
 * `object-contain` still guarantees nothing is stretched or cropped.
 *
 * Like ClubLogo, it sits bare on the page — competition logos already carry
 * their own colour, and a container around them would only add noise to what
 * is a metadata row.
 */
export function CompetitionLogo({
  competition,
  size = 24,
  /**
   * Render into a fixed box of this width instead of letting the width
   * follow the artwork. The mark is letterboxed inside it and pinned left,
   * so a column of logos lines up on both edges however much their aspect
   * ratios differ — LALIGA's wordmark is four times wider than Serie A's
   * crest. Nothing is stretched or cropped either way.
   */
  boxWidth,
  className,
  priority = false,
}: {
  competition: Competition;
  size?: number;
  boxWidth?: number;
  className?: string;
  /** Set on above-the-fold logos so they are not lazy-loaded. */
  priority?: boolean;
}) {
  const logo = resolveCompetitionLogo(competition);

  if (!logo) {
    return <CompetitionLogoFallback size={size} className={className} />;
  }

  return (
    <Image
      src={logo}
      alt=""
      aria-hidden="true"
      width={Math.round(boxWidth ?? size * MAX_ASPECT)}
      height={size}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("shrink-0 object-contain", className)}
      style={
        boxWidth
          ? { height: size, width: boxWidth, objectPosition: "left center" }
          : { height: size, width: "auto", maxWidth: size * MAX_ASPECT }
      }
    />
  );
}

/**
 * Neutral mark for a competition whose logo we do not have. Deliberately
 * generic: showing another competition's badge would be worse than showing
 * none, and the full competition name always sits beside it.
 */
export function CompetitionLogoFallback({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 text-ink-faint", className)}
      style={{ width: size, height: size }}
    >
      {/* Plain trophy outline — reads as "a competition" without imitating one. */}
      <path
        d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 1.6H5.6v1.2A2.8 2.8 0 0 0 8.4 9.6M16 5.6h2.4v1.2a2.8 2.8 0 0 1-2.8 2.8M12 13v3.4m-2.8 3.2h5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
