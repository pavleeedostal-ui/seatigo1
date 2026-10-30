import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-paper-deep text-ink-muted",
        album: "bg-album text-white",
        signal: "bg-signal text-ink",
        outline: "border border-line text-ink-muted",
        quiet: "text-ink-faint",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
