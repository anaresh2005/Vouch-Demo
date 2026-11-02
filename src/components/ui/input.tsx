import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-0 bg-card px-3 py-2 text-base text-foreground shadow-edge transition-shadow duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] focus-visible:ring-4 focus-visible:ring-primary/25 aria-[invalid=true]:shadow-[0_0_0_1px_hsl(var(--destructive))] disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
