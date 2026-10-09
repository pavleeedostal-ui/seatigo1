import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/ui/button";

/**
 * The homepage's one editorial block: a wide matchday image with a short
 * invitation over it and a single way through to the full fixture list.
 *
 * It replaces the competition and club grids that used to sit here. Those
 * were a directory — three rows of links restating navigation that already
 * exists in the header and on their own pages. This asks a question
 * instead, which is the job of a homepage.
 *
 * ## The image
 *
 * `image` is deliberately optional and deliberately empty for now. Seatigo
 * ships no photography — the only images in the repo are club crests and
 * competition marks — and hotlinking a stock photo would mean serving an
 * asset the project has no licence to. So the slot is real and typed, and
 * until a licensed photograph is dropped in, `BannerArtwork` renders a
 * designed panel built from the hero's own stadium-arc motif.
 *
 * To use a real photograph: put it in /public/images/editorial, then
 *
 *   <DiscoverMatchesBanner
 *     image={{ src: "/images/editorial/matchday.jpg", alt: "" }}
 *   />
 *
 * Nothing else changes — the overlay, gradient and text are already built
 * to sit on a photograph. Keep `alt` empty: the headline beside it already
 * says what the block is, so the image is decorative to a screen reader.
 */
export interface BannerImage {
  src: string;
  alt: string;
}

export function DiscoverMatchesBanner({ image }: { image?: BannerImage }) {
  const t = useTranslations("Home.discover");

  return (
    <Section>
      <div className="relative isolate overflow-hidden rounded-surface bg-hero">
        {/* The picture, or the panel that stands in for one. */}
        <div className="absolute inset-0">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 1184px, 100vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <BannerArtwork />
          )}
        </div>

        {/* Readability wash. Bottom-up on a phone where the text sits low,
            left-to-right on wider screens where it sits beside the image
            and must not cover it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-hero via-hero/75 to-transparent sm:bg-gradient-to-r sm:from-hero sm:via-hero/80 sm:to-transparent"
        />

        <div className="relative flex min-h-[26rem] flex-col justify-end p-7 sm:min-h-0 sm:aspect-[16/9] sm:justify-center sm:p-10 lg:aspect-[16/7] lg:p-14">
          <div className="max-w-md lg:max-w-lg">
            <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.025em] text-hero-ink sm:text-[38px] lg:text-[44px]">
              {t("title")}
            </h2>

            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-hero-ink-muted sm:text-[17px]">
              {t("body")}
            </p>

            <Button asChild variant="gold" size="lg" className="mt-7">
              <Link href="/matches">
                {t("cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Stands in for the photograph until there is one.
 *
 * Built from the same stadium arcs and warm glow as the hero, so an empty
 * image slot reads as a considered dark panel rather than as a missing
 * asset. It is replaced wholesale the moment `image` is passed.
 */
function BannerArtwork() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-hero-elevated via-hero to-hero" />

      {/* Warm light from the right, where the text is not. */}
      <div className="absolute -right-[10%] top-[-30%] h-[160%] w-[70%] rounded-full bg-hero-gold/[0.07] blur-[120px]" />

      <svg
        className="absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 text-hero-champagne/[0.06] sm:right-[6%] lg:h-[680px] lg:w-[680px]"
        viewBox="0 0 680 680"
        fill="none"
      >
        <circle cx="340" cy="340" r="339" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="251" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="164" stroke="currentColor" strokeWidth="1" />
        <circle cx="340" cy="340" r="76" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
