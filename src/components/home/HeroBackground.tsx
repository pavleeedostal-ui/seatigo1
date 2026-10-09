/**
 * The hero's field: near-black green, lifted by one soft warm glow behind
 * the headline and a set of faint stadium arcs off to the side.
 *
 * Everything here is within a few percent of the base colour. The point is
 * atmosphere, not decoration — if any of it is the first thing you notice,
 * it is too strong.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base field, warming very slightly toward the top-left. */}
      <div className="absolute inset-0 bg-gradient-to-br from-hero-elevated via-hero to-hero" />

      {/* A single warm pool of light behind the headline, so the composition
          has a bright corner to read from. Gold at 6% — enough to feel, not
          enough to name. */}
      <div className="absolute -left-[15%] -top-[40%] h-[120%] w-[70%] rounded-full bg-hero-gold/[0.06] blur-[120px]" />

      {/* Stadium arcs: concentric, off-centre, and almost invisible. */}
      <svg
        className="absolute -right-32 top-1/2 h-[680px] w-[680px] -translate-y-1/2 text-hero-champagne/[0.05] sm:-right-16"
        viewBox="0 0 680 680"
        fill="none"
      >
        <circle cx="340" cy="340" r="339" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="252" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="165" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="78" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Hairline where the hero meets the page, so the edge is a considered
          line rather than an abrupt stop. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-hero-line" />
    </div>
  );
}
