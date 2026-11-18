import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@dashboard/lib/utils";

// Status labels as the App UI Guidelines draw them (Figma "Vouch Branding (Revamped)", November 2026):
// 20px tall, 4px corners, a 6px dot in the status color and the label in ink (12px Regular) on a light
// tint of the same color, built only from palette colors. One color per order stage: gray for placed,
// charge pending and canceled; sky for in transit; rose for post due; green for posted; red for charged.
// Restyled in the demo ahead of the product, which still has tinted fills with colored text.
const badgeVariants = cva(
  "inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-sm px-2 text-xs leading-4 text-foreground [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-status-gray/[.18]",
        secondary: "bg-status-gray/[.18]",
        outline: "border border-border bg-card",
        primary: "bg-primary/10 text-primary",
        success: "bg-status-green/[.16]",
        warning: "bg-status-rose/[.16]",
        attention: "bg-status-gray/[.18]",
        destructive: "bg-status-red/[.16]",
        info: "bg-status-sky/[.16]",
        dot: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const DOTS: Partial<Record<NonNullable<VariantProps<typeof badgeVariants>["variant"]>, string>> = {
  default: "bg-status-gray",
  secondary: "bg-status-gray",
  success: "bg-status-green",
  warning: "bg-status-rose",
  attention: "bg-status-gray",
  destructive: "bg-status-red",
  info: "bg-status-sky",
  dot: "bg-primary",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {DOTS[variant ?? "default"] && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOTS[variant ?? "default"])} aria-hidden="true" />}
      {children}
    </div>
  );
}

export { Badge };
