import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium text-subdued transition-[background-color,color,box-shadow] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_0_0_1.5px_hsl(var(--foreground))]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "bg-card shadow-edge",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2",
        lg: "h-9 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
