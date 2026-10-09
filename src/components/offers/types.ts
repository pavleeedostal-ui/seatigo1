import type { SeatCategoryKey } from "@/types/ticketing";

export type QuantityFilter = "any" | "1" | "2" | "3" | "4+";
export type MaxPriceFilter = "any" | "50" | "100" | "150" | "250";

export interface OffersFiltersValue {
  category: SeatCategoryKey | "all";
  section: string;
  quantity: QuantityFilter;
  providerId: string;
  maxPrice: MaxPriceFilter;
}

export const DEFAULT_OFFERS_FILTERS: OffersFiltersValue = {
  category: "all",
  section: "all",
  quantity: "any",
  providerId: "all",
  maxPrice: "any",
};
