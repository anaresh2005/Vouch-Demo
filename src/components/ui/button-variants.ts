import { cva } from "class-variance-authority";

// Stripe-style buttons: flat, 6px corners, a hairline edge on secondary buttons, and a soft
// 4px periwinkle focus ring. A disabled primary keeps its shape and washes out to a pale tint.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-primary/40",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50",
        outline: "bg-card text-secondary-foreground shadow-edge hover:bg-secondary disabled:opacity-50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-50",
        ghost: "text-secondary-foreground hover:bg-accent disabled:opacity-50",
        link: "font-medium text-primary hover:text-primary-hover disabled:opacity-50",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-7 px-2",
        lg: "h-10 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
