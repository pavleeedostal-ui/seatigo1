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
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background">
        <Icon className="h-6 w-6 text-ink-faint" />
      </div>
      <h2 className="text-[19px] font-medium text-ink">
        {notAnnounced ? t("notAnnouncedTitle") : t("noOffersTitle")}
      </h2>
      <p className="mt-2 max-w-md text-[15px] text-ink-muted">
        {notAnnounced ? t("notAnnouncedBody") : t("noOffersBody")}
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/matches">{t("browseOther")}</Link>
      </Button>
    </div>
  );
}
