import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button roles, by the ground they sit on:
 *
 * - `primary` — ink on paper. The one action a working page is for.
 * - `signal` — yellow on the album field. The primary action where the page
 *   is blue (the hero search, the header on the homepage, the footer).
 * - `light` — white on the album field, for its secondary actions.
 * - `outline` / `ghost` / `link` — secondary on paper.
 *
 * `signal`, `light` and `outline` share one box (height, radius, 1px
 * border), so the header can cross-fade between them without its
 * neighbours moving.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button font-semibold transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-album",
        signal:
          "border border-transparent bg-signal text-ink hover:bg-signal-deep",
        light:
          "border border-transparent bg-white text-ink hover:bg-paper",
        outline:
          "border border-line-strong bg-slot text-ink hover:border-ink",
        ghost: "text-ink-muted hover:bg-paper-deep hover:text-ink",
        link: "h-auto rounded-none p-0 text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        default: "h-11 px-5 text-[15px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
