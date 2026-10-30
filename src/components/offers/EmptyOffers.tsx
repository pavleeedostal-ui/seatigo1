import { useTranslations } from "next-intl";
import { CalendarClock, TicketX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { TicketAvailability } from "@/lib/fixtures/availability";

/**
 * Shown on a match page that has nothing to compare. The two reasons are
 * kept separate because they mean different things to a fan: "nobody is
 * selling yet" vs "the league hasn't scheduled it yet". Neither invents
 * prices, sellers or quantities, and both keep browsing available.
 */
export function EmptyOffers({
  availability,
}: {
  availability: Exclude<TicketAvailability, "available">;
}) {
  const t = useTranslations("MatchDetail");
  const notAnnounced = availability === "not_announced";
  const Icon = notAnnounced ? CalendarClock : TicketX;

  return (
    // An empty slot on the page: the fixture is real and listed, nothing is
    // stuck in it yet.
    <div className="slot-empty flex flex-col items-center justify-center rounded-card px-6 py-16 text-center sm:py-20">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep">
        <Icon className="h-6 w-6 text-ink-muted" />
      </div>
      <h2 className="font-display text-balance text-[36px] text-ink sm:text-[44px]">
        {notAnnounced ? t("notAnnouncedTitle") : t("noOffersTitle")}
      </h2>
      <p className="mt-3 max-w-md text-[16px] text-ink-muted">
        {notAnnounced ? t("notAnnouncedBody") : t("noOffersBody")}
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/matches">{t("browseOther")}</Link>
      </Button>
    </div>
  );
}
