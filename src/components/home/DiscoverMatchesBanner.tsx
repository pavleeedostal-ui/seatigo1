import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The album's stadium page: one real photograph of a real matchday, run
 * edge to edge, with a single white slot pressed onto it that invites the
 * visitor into the full fixture list.
 *
 * The CTA goes to `/matches` — the whole directory, fixtures without offers
 * included — never a filtered subset.
 *
 * ## The photograph
 *
 * Licensed, not hotlinked: the file lives in `/public/images/editorial`,
 * with its source and licence in `CREDITS.md` beside it. CC BY requires
 * attribution, so the credit is rendered on the image itself and links to
 * both the source and the licence. Keep `alt` empty: the slot's heading
 * already says what the block is for.
 */
export interface BannerImage {
  src: string;
  alt: string;
  author: string;
  license: string;
  sourceUrl: string;
  licenseUrl: string;
}

export function DiscoverMatchesBanner({ image }: { image: BannerImage }) {
  const t = useTranslations("Home.discover");

  return (
    <section className="relative">
      <div className="relative h-[clamp(20rem,62vw,40rem)] w-full overflow-hidden bg-album-night">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          className="object-cover object-[50%_45%]"
        />
        {/* Only enough shade at the foot of the frame to carry the credit. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent"
        />
        <p className="absolute bottom-3 right-4 text-[12px] text-white/85 sm:right-6">
          <a href={image.sourceUrl} target="_blank" rel="noreferrer noopener" className="underline decoration-white/40 hover:decoration-white">
            {t("credit", { author: image.author })}
          </a>
          {", "}
          <a href={image.licenseUrl} target="_blank" rel="noreferrer noopener license" className="underline decoration-white/40 hover:decoration-white">
            {image.license}
          </a>
        </p>
      </div>

      <div className="container-page relative">
        <div className="sticker relative -mt-24 max-w-xl p-6 sm:-mt-40 sm:p-8 lg:-mt-48 lg:p-10">
          <h2 className="font-display text-balance text-[40px] text-ink sm:text-[56px]">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-[16px] leading-relaxed text-ink-muted sm:text-[17px]">
            {t("body")}
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link href="/matches">
              {t("cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
