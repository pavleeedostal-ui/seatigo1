"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { SeatCategoryKey } from "@/types/ticketing";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StadiumMapProps {
  /** Categories that currently have at least one offer. */
  availableCategories: SeatCategoryKey[];
  activeCategory: SeatCategoryKey | "all";
  onSelect: (category: SeatCategoryKey | "all") => void;
  offerCounts?: Partial<Record<SeatCategoryKey, number>>;
}

const CATEGORY_COLORS: Record<SeatCategoryKey, string> = {
  behind_goal: "#5B7DB1",
  longside: "#3D5A80",
  shortside: "#7C93B3",
  premium: "#B6FF4A",
  hospitality: "#EE8707",
};

const ZONES: { area: SeatCategoryKey; d: string }[] = [
  { area: "behind_goal", d: "M84,20 H316 V80 H84 Z" },
  { area: "behind_goal", d: "M84,220 H316 V280 H84 Z" },
  { area: "longside", d: "M20,84 H80 V216 H20 Z" },
  { area: "longside", d: "M320,84 H380 V216 H320 Z" },
  { area: "shortside", d: "M20,20 H80 V80 H20 Z" },
  { area: "shortside", d: "M320,20 H380 V80 H320 Z" },
  { area: "shortside", d: "M20,220 H80 V280 H20 Z" },
  { area: "shortside", d: "M320,220 H380 V280 H320 Z" },
  { area: "premium", d: "M96,90 H116 V210 H96 Z" },
  { area: "premium", d: "M284,90 H304 V210 H284 Z" },
];

export function StadiumMap({
  availableCategories,
  activeCategory,
  onSelect,
  offerCounts,
}: StadiumMapProps) {
  const t = useTranslations("Stadium");
  const available = new Set(availableCategories);

  function toggle(category: SeatCategoryKey) {
    onSelect(activeCategory === category ? "all" : category);
  }

  function renderZone(zone: { area: SeatCategoryKey; d: string }, i: number) {
    const isAvailable = available.has(zone.area);
    const isActive = activeCategory === zone.area;
    const color = CATEGORY_COLORS[zone.area];
    const count = offerCounts?.[zone.area];

    return (
      <Tooltip key={`${zone.area}-${i}`}>
        <TooltipTrigger asChild>
          <motion.path
            d={zone.d}
            onClick={() => isAvailable && toggle(zone.area)}
            className={isAvailable ? "cursor-pointer" : "cursor-not-allowed"}
            initial={false}
            animate={{
              fill: color,
              opacity: !isAvailable ? 0.15 : isActive ? 1 : 0.5,
            }}
            whileHover={isAvailable ? { opacity: 0.85 } : undefined}
            transition={{ duration: 0.2 }}
            stroke={isActive ? "var(--navy)" : "white"}
            strokeWidth={isActive ? 2.5 : 1.5}
            role="button"
            tabIndex={isAvailable ? 0 : -1}
            aria-label={t(`categories.${zone.area}.name`)}
            aria-disabled={!isAvailable}
            onKeyDown={(e) => {
              if (isAvailable && (e.key === "Enter" || e.key === " ")) toggle(zone.area);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{t(`categories.${zone.area}.name`)}</p>
          {count != null && <p className="text-white/70">{count}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  const hospitalityAvailable = available.has("hospitality");
  const hospitalityActive = activeCategory === "hospitality";

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 400 300"
        className="w-full max-w-md"
        role="img"
        aria-label={t("mapTitle")}
      >
        <rect x="4" y="4" width="392" height="292" rx="24" fill="#EEF1F5" />

        {ZONES.map(renderZone)}

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.rect
              x={326}
              y={30}
              width={44}
              height={36}
              rx={8}
              onClick={() => hospitalityAvailable && toggle("hospitality")}
              className={hospitalityAvailable ? "cursor-pointer" : "cursor-not-allowed"}
              initial={false}
              animate={{
                fill: CATEGORY_COLORS.hospitality,
                opacity: !hospitalityAvailable ? 0.15 : hospitalityActive ? 1 : 0.75,
              }}
              whileHover={hospitalityAvailable ? { opacity: 1 } : undefined}
              stroke={hospitalityActive ? "var(--navy)" : "white"}
              strokeWidth={hospitalityActive ? 2.5 : 1.5}
              role="button"
              tabIndex={hospitalityAvailable ? 0 : -1}
              aria-label={t("categories.hospitality.name")}
              aria-disabled={!hospitalityAvailable}
              onKeyDown={(e) => {
                if (hospitalityAvailable && (e.key === "Enter" || e.key === " "))
                  toggle("hospitality");
              }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{t("categories.hospitality.name")}</p>
            {offerCounts?.hospitality != null && (
              <p className="text-white/70">{offerCounts.hospitality}</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Pitch */}
        <rect x="120" y="90" width="160" height="120" rx="10" fill="#1F8A4C" />
        <rect
          x="122"
          y="92"
          width="156"
          height="116"
          rx="8"
          fill="none"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <line x1="200" y1="92" x2="200" y2="208" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="20" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="1.5" fill="white" fillOpacity="0.6" />
      </svg>

      <p className="text-xs text-ink-muted">{t("mapHint")}</p>
    </div>
  );
}
