import Image from "next/image";
import type { TicketProvider } from "@/types/ticketing";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#0E1E5B",
  "#8E1B2E",
  "#0B5D3B",
  "#5B2A86",
  "#B45309",
  "#0E7490",
];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ProviderBadge({
  provider,
  size = 36,
  className,
}: {
  provider: TicketProvider;
  size?: number;
  className?: string;
}) {
  if (provider.logo) {
    return (
      <Image
        src={provider.logo}
        alt={provider.name}
        width={size}
        height={size}
        className={cn("rounded-lg object-contain", className)}
      />
    );
  }

  const color = PALETTE[hashCode(provider.id) % PALETTE.length];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.34,
      }}
      role="img"
      aria-label={provider.name}
    >
      {initials(provider.name)}
    </span>
  );
}
