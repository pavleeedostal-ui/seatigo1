import { NextResponse, type NextRequest } from "next/server";
import { getFootballDataProvider } from "@/lib/football";
import { getOfferByRedirectId } from "@/lib/ticketing/aggregator";
import { recordOutboundClick } from "@/lib/ticketing/analytics";
import { recordClubInterest } from "@/lib/analytics/club-popularity";

/**
 * Every "View deal" / "Go to provider" button links here instead of
 * straight to the seller. That gives Seatigo one place to record the
 * outbound click (no cookies, no personal data — see analytics.ts) and to
 * validate the destination before sending anyone off-site.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await params;
  const offer = await getOfferByRedirectId(offerId);

  if (!offer) {
    return NextResponse.redirect(new URL("/en/matches", request.url), { status: 302 });
  }

  let destination: URL;
  try {
    destination = new URL(offer.deeplink);
  } catch {
    return NextResponse.redirect(new URL("/en/matches", request.url), { status: 302 });
  }

  if (destination.protocol !== "https:") {
    return NextResponse.redirect(new URL("/en/matches", request.url), { status: 302 });
  }

  recordOutboundClick({
    offerId: offer.id,
    providerId: offer.providerId,
    fixtureId: offer.fixtureId,
    category: offer.category,
    price: offer.price,
    currency: offer.currency,
    sponsored: Boolean(offer.sponsored),
  });

  // The strongest interest signal Seatigo has — someone leaving for a
  // seller — so it also counts towards both clubs' popularity. Looking the
  // fixture up is a map read, and a failure here must never cost the user
  // their redirect.
  const fixture = await getFootballDataProvider().getMatchById(offer.fixtureId);
  if (fixture) {
    recordClubInterest({
      type: "seller_outbound_click",
      clubIds: [fixture.homeTeam.id, fixture.awayTeam.id],
      fixtureId: fixture.id,
    });
  }

  return NextResponse.redirect(destination, { status: 302 });
}
