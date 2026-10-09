/**
 * A very quiet backdrop: an off-white wash that fades into the page, plus a
 * faint pitch arc. It should never compete with the headline or the search
 * surface sitting on top of it.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-white" />
      <svg
        className="absolute left-1/2 top-0 h-[420px] w-[1100px] -translate-x-1/2 text-navy/[0.05]"
        viewBox="0 0 1100 420"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="550" cy="70" r="300" stroke="currentColor" strokeWidth="1" />
        <circle cx="550" cy="70" r="190" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
