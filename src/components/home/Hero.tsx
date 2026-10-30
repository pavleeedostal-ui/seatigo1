import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types/football";
import type { CheapestOfferSummary } from "@/types/ticketing";
import { getTicketAvailability } from "@/lib/fixtures/availability";
import { formatPrice } from "@/lib/format";
import { SearchBar } from "@/components/matches/SearchBar";
import { SlotTab } from "@/components/matches/MatchCard";
import { ClubLogo } from "@/components/shared/ClubLogo";
import { cn } from "@/lib/utils";

/**
 * The album's opening page.
 *
 * One ultramarine field, continuous with the header above it. The slogan is
 * set at poster scale in the album's condensed capitals; beside it, a loose
 * sheet of real stickers — the next fixtures, live from the football
 * provider, with their real "from" prices where a seller has one. Under
 * both, the working search, as a white label strip.
 *
 * ## The overlap
 *
 * The search strip hangs half off the blue field onto the paper below: the
 * field carries bottom padding, and the strip pulls itself up into it with
 * a matching negative margin. The section is a `z-10` stacking context so
 * the autocomplete paints above the sections that follow. Nothing here
 * clips — `overflow-hidden` would cut the strip and trap the suggestions.
 *
 * On a phone the sticker sheet moves below the search, onto the paper, so
 * the search is inside the first screen; it is the page's job.
 */

const QUICK_OPTIONS = [
  { key: "available", href: "/matches?availability=available" },
  { key: "weekend", href: "/matches?range=weekend" },
  { key: "bestPrices", href: "/matches?sort=price_asc" },
] as const;

/** Each sticker lands at its own slight angle, like ones pressed in by hand. */
const TILTS = ["sm:-rotate-[3deg]", "sm:rotate-[2deg]", "sm:-rotate-[1deg]"];

export interface HeroSticker {
  match: Match;
  summary: CheapestOfferSummary | null;
}

export function Hero({ stickers }: { stickers: HeroSticker[] }) {
  const t = useTranslations("Hero");

  // The foil goes on one sticker only: the cheapest real price on the sheet.
  const priced = stickers.filter((s) => s.summary);
  const cheapestId =
    priced.length > 0
      ? priced.reduce((min, s) => (s.summary!.lowestPrice < min.summary!.lowestPrice ? s : min))
          .match.id
      : null;

  // "Find your Seat": the last word is the one the product is about, so it
  // takes the signal colour. Emphasis by colour on one word, nothing else.
  const words = t("headline").split(" ");
  const last = words.pop();

  const sheet = (onAlbum: boolean) => (
    <ul
      className={cn(
        "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        onAlbum
          ? "flex-col items-end gap-0 overflow-visible pb-0"
          : "-mx-4 px-4 sm:-mx-8 sm:px-8",
      )}
    >
      {stickers.slice(0, 3).map((s, i) => (
        <li
          key={s.match.id}
          className={cn(
            "w-[78%] max-w-[300px] shrink-0 snap-start sm:w-[300px]",
            TILTS[i],
            onAlbum && i === 1 && "-mt-4 mr-16",
            onAlbum && i === 2 && "-mt-4 mr-4",
          )}
        >
          <HeroStickerCard {...s} foil={s.match.id === cheapestId} onAlbum={onAlbum} />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative z-10">
      <div className="on-album relative bg-album pb-16 sm:pb-[4.5rem]">
        <AlbumGrain />
        <div className="container-page relative grid grid-cols-1 gap-8 pt-8 sm:pt-12 lg:grid-cols-12 lg:pt-14">
          <div className="lg:col-span-7">
            <h1 className="font-display text-[clamp(4rem,17vw,6rem)] text-white sm:text-[clamp(6rem,12vw,9.5rem)]">
              {words.join(" ")} <span className="text-signal">{last}</span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[18px] leading-snug text-album-ink-muted sm:mt-6 sm:text-[20px]">
              {t("subtitle")}
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-8">
              {QUICK_OPTIONS.map((option) => (
                <li key={option.key}>
                  <Link
                    href={option.href}
                    className="group inline-flex items-center gap-1.5 py-1 text-[14px] font-medium text-white underline decoration-album-line-strong underline-offset-4 transition-colors hover:decoration-white"
                  >
                    {t(`quick.${option.key}` as const)}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {stickers.length > 0 && (
            <div className="hidden lg:col-span-5 lg:block">
              <h2 className="sr-only">{t("stickersLabel")}</h2>
              {sheet(true)}
            </div>
          )}
        </div>
      </div>

      {/* Last on the field, and the only thing allowed past its edge. */}
      <div className="container-page relative z-20 -mt-11 sm:-mt-12">
        <SearchBar tone="hero" />
      </div>

      {stickers.length > 0 && (
        <div className="container-page mt-8 lg:hidden">
          <h2 className="font-tab mb-3 text-[12px] text-ink-muted">{t("stickersLabel")}</h2>
          {sheet(false)}
        </div>
      )}
    </section>
  );
}

/**
 * One fixture on the hero's sheet. The same anatomy as the album's
 * `MatchCard`, compacted: tab, crests, names, and either a real price or
 * the empty-slot line.
 */
function HeroStickerCard({
  match,
  summary,
  foil,
  onAlbum,
}: HeroSticker & { foil: boolean; onAlbum: boolean }) {
  const locale = useLocale();
  const t = useTranslations("Matches.card");
  const availability = getTicketAvailability(match, Boolean(summary));
  const stuck = availability === "available" && summary;

  return (
    <Link
      href={`/matches/${match.slug}`}
      {...(stuck
        ? {
            "data-seatigo-cta": "compare_tickets_click",
            "data-seatigo-clubs": `${match.homeTeam.id},${match.awayTeam.id}`,
            "data-seatigo-fixture": match.id,
          }
        : {})}
      className="group block rounded-card"
    >
      <article
        className={cn(
          "rounded-card p-4",
          stuck ? "sticker" : onAlbum ? "slot-empty-on-album" : "slot-empty",
        )}
      >
        <SlotTab match={match} className={!stuck && onAlbum ? "bg-white text-album" : undefined} />
        <div className="mt-4 flex items-center gap-2">
          <ClubLogo club={match.homeTeam} size={44} priority={onAlbum} />
          <span
            className={cn("font-tab text-[12px]", !stuck && onAlbum ? "text-album-ink-muted" : "text-ink-muted")}
          >
            v
          </span>
          <ClubLogo club={match.awayTeam} size={44} priority={onAlbum} />
        </div>
        <p
          className={cn(
            "font-display mt-3 text-[22px] leading-[0.95]",
            !stuck && onAlbum ? "text-white" : "text-ink",
          )}
        >
          <span className="block truncate">{match.homeTeam.name}</span>
          <span className="block truncate">{match.awayTeam.name}</span>
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {stuck ? (
            <p
              className={cn(
                "inline-flex items-baseline gap-1.5 rounded-[6px] px-2 py-1",
                foil ? "foil" : "bg-paper",
              )}
            >
              <span className="font-tab text-[11px] text-ink-muted">{t("from")}</span>
              <span className="font-display tabular text-[24px] text-ink">
                {formatPrice(summary.lowestPrice, summary.currency, locale)}
              </span>
            </p>
          ) : (
            <p className={cn("font-tab text-[12px]", onAlbum ? "text-album-ink-muted" : "text-ink-muted")}>
              {availability === "not_announced" ? t("dateTbc") : t("noOffers")}
            </p>
          )}
          <ArrowRight
            aria-hidden="true"
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1",
              !stuck && onAlbum ? "text-white" : "text-ink",
            )}
          />
        </div>
      </article>
    </Link>
  );
}

/**
 * Printed-page texture: a fine halftone of the album blue itself, so the
 * field reads as ink on paper rather than as a flat screen colour. It is
 * one radial dot pattern at very low contrast, fading out toward the search.
 */
function AlbumGrain() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1.2px)] [background-size:7px_7px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
    />
  );
}
