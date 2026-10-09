"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import type { TicketProvider } from "@/types/ticketing";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OffersFiltersPanel } from "./OffersFiltersPanel";
import type { OffersFiltersValue } from "./types";

export function OffersFiltersDrawer({
  value,
  onChange,
  providers,
  sections,
}: {
  value: OffersFiltersValue;
  onChange: (value: OffersFiltersValue) => void;
  providers: TicketProvider[];
  sections: string[];
}) {
  const t = useTranslations("Offers.filters");
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        {t("title")}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
          </SheetHeader>
          <OffersFiltersPanel
            value={value}
            onChange={onChange}
            providers={providers}
            sections={sections}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
