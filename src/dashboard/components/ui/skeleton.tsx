import { cn } from "@dashboard/lib/utils";

// A grey placeholder bar shown while content loads, so layouts never jump or flash blank.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-skeleton", className)} {...props} />;
}

export { Skeleton };
