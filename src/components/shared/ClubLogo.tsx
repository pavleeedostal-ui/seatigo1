import Image from "next/image";
import type { Club } from "@/types/football";
import { resolveClubCrest } from "@/lib/football/club-logos";
import { cn } from "@/lib/utils";

/**
 * A club's real crest, at a fixed square box with the artwork letterboxed
 * inside it (`object-contain`), so crests of different aspect ratios line up
 * without ever being stretched or cropped.
 *
 * Crests sit bare on the page — no coloured disc, no border — because the
 * badges already carry the clubs' own colours.
 */
export function ClubLogo({
  club,
  size = 32,
  className,
  priority = false,
}: {
  club: Club;
  size?: number;
  className?: string;
  /** Set on above-the-fold crests so they are not lazy-loaded. */
  priority?: boolean;
}) {
  const crest = resolveClubCrest(club);

  if (!crest) {
    return <ClubLogoFallback size={size} className={className} />;
  }

  return (
    <Image
      src={crest}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Neutral mark for a club whose crest we do not have. Deliberately generic:
 * assigning a lookalike club's badge would be worse than showing nothing.
 */
export function ClubLogoFallback({
  size = 32,
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
      {/* Simple shield outline — reads as "a club" without impersonating one. */}
      <path
        d="M12 2.6 4.6 5.1v6.2c0 4.5 3 8.2 7.4 10.1 4.4-1.9 7.4-5.6 7.4-10.1V5.1L12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
