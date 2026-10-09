"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  OfferSortKey,
  SeatCategoryKey,
  TicketOfferWithProvider,
  TicketProvider,
} from "@/types/ticketing";
import { sortOffers } from "@/lib/ticketing/sort";
import { StadiumMap } from "@/components/stadium/StadiumMap";
import { OffersSummary } from "./OffersSummary";
import { OffersFiltersPanel } from "./OffersFiltersPanel";
import { OffersFiltersDrawer } from "./OffersFiltersDrawer";
import { SortSelect } from "./SortSelect";
import { OfferRow } from "./OfferRow";
import { Disclaimer } from "./Disclaimer";
import { DEFAULT_OFFERS_FILTERS, type OffersFiltersValue } from "./types";

export function TicketComparison({
  offers,
  initialTickets,
}: {
  offers: TicketOfferWithProvider[];
  initialTickets?: string;
}) {
  const t = useTranslations("Offers");
  const [sortKey, setSortKey] = useState<OfferSortKey>("recommended");
  const [filters, setFilters] = useState<OffersFiltersValue>({
    ...DEFAULT_OFFERS_FILTERS,
    quantity: (initialTickets as OffersFiltersValue["quantity"]) ?? "any",
  });

  const providers = useMemo(() => {
    const map = new Map<string, TicketProvider>();
    for (const offer of offers) map.set(offer.provider.id, offer.provider);
    return Array.from(map.values());
  }, [offers]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(offers.map((o) => o.category))) as SeatCategoryKey[];
  }, [offers]);

  const offerCounts = useMemo(() => {
    const counts: Partial<Record<SeatCategoryKey, number>> = {};
    for (const offer of offers) {
      counts[offer.category] = (counts[offer.category] ?? 0) + 1;
    }
    return counts;
  }, [offers]);

  const sections = useMemo(() => {
    return Array.from(new Set(offers.map((o) => o.section))).sort();
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (filters.category !== "all" && offer.category !== filters.category) return false;
      if (filters.section !== "all" && offer.section !== filters.section) return false;
      if (filters.providerId !== "all" && offer.providerId !== filters.providerId) return false;
      if (filters.quantity !== "any") {
        const min = filters.quantity === "4+" ? 4 : Number(filters.quantity);
        if (offer.quantityAvailable < min) return false;
      }
      if (filters.maxPrice !== "any" && offer.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [offers, filters]);

  const sortedOffers = useMemo(
    () => sortOffers(filteredOffers, sortKey),
    [filteredOffers, sortKey],
  );

  const lowestVisiblePrice = sortedOffers.length
    ? Math.min(...sortedOffers.map((o) => o.price))
    : null;

  const overallSellerCount = providers.length;

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-10">
        <div className="flex justify-center lg:sticky lg:top-32 lg:self-start">
          <StadiumMap
            availableCategories={availableCategories}
            activeCategory={filters.category}
            onSelect={(category) => setFilters({ ...filters, category })}
            offerCounts={offerCounts}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="sticky top-18 z-30 -mx-5 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white/90 px-5 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
            <OffersSummary
              offerCount={offers.length}
              sellerCount={overallSellerCount}
              categoryCount={availableCategories.length}
            />
            <div className="flex items-center gap-2">
              <OffersFiltersDrawer
                value={filters}
                onChange={setFilters}
                providers={providers}
                sections={sections}
              />
              <SortSelect value={sortKey} onChange={setSortKey} />
            </div>
          </div>

          <div className="hidden lg:block">
            <OffersFiltersPanel
              value={filters}
              onChange={setFilters}
              providers={providers}
              sections={sections}
              layout="bar"
            />
          </div>

          <div className="flex flex-col gap-3">
            {sortedOffers.length === 0 ? (
              <p className="rounded-card border border-dashed border-border p-8 text-center text-[15px] text-ink-muted">
                {t("empty.description")}
              </p>
            ) : (
              sortedOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  isBestPrice={offer.price === lowestVisiblePrice}
                />
              ))
            )}
          </div>

          <Disclaimer className="mt-2" />
        </div>
      </div>
    </div>
  );
}
