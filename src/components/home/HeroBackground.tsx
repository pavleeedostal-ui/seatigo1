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
          has a bright corner to read from. Gold at 5% — enough to feel, not
          enough to name. */}
      <div className="absolute -left-[15%] -top-[40%] h-[120%] w-[70%] rounded-full bg-hero-gold/[0.05] blur-[130px]" />

      {/* Stadium arcs. Scaled up and faded down from where they started:
          larger rings curve more slowly across the frame, which is what
          makes them read as atmosphere rather than as a diagram. The aim is
          that you notice them second, not first. */}
      <svg
        className="absolute -right-48 top-1/2 h-[880px] w-[880px] -translate-y-1/2 text-hero-champagne/[0.035] sm:-right-28"
        viewBox="0 0 880 880"
        fill="none"
      >
        <circle cx="440" cy="440" r="439" stroke="currentColor" strokeWidth="1" />
        <circle cx="440" cy="440" r="326" stroke="currentColor" strokeWidth="1" />
        <circle cx="440" cy="440" r="214" stroke="currentColor" strokeWidth="1" />
        <circle cx="440" cy="440" r="101" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Hairline where the hero meets the page, so the edge is a considered
          line rather than an abrupt stop. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-hero-line" />
    </div>
  );
}
