import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Four button roles only: `primary` (lime, one per view), `gold` (the
 * homepage hero's premium action), `dark` (navy, the in-context action),
 * and `outline`/`ghost` for everything secondary.
 *
 * `gold` is scoped to the hero on purpose. It is the one surface with the
 * dark luxury treatment, and a muted gold needs a dark field behind it to
 * read as gold rather than as mustard.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-lime text-navy hover:bg-lime-dark",
        gold: "bg-hero-gold text-surface-warm-ink hover:bg-hero-champagne",
        dark: "bg-navy text-white hover:bg-navy-soft",
        outline:
          "border border-border bg-white text-ink hover:border-border-strong hover:bg-background",
        ghost: "text-ink-muted hover:bg-background hover:text-ink",
        link: "h-auto rounded-none p-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        default: "h-11 px-5 text-sm",
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
