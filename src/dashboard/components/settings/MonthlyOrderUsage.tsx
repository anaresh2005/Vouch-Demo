import { Progress } from '@dashboard/components/ui/progress';
import { Skeleton } from '@dashboard/components/ui/skeleton';
import { useMonthlyOrderUsage, type MonthlyOrderUsage as Usage } from '@dashboard/hooks/useMonthlyOrderUsage';
import { cn } from '@dashboard/lib/utils';

// From 80% of the limit the merchant is told it's nearly full.
const NEARLY_FULL = 0.8;

function explain(usage: Usage) {
  if (usage.orders >= usage.limit) return `Limit reached. The Post to Pay button on your store can't be clicked until ${usage.resetDate}.`;
  const left = usage.limit - usage.orders;
  if (usage.orders >= usage.limit * NEARLY_FULL) return `Nearly full: ${left} ${left === 1 ? 'order' : 'orders'} left. At ${usage.limit}, the button can't be clicked until ${usage.resetDate}.`;
  return `Resets ${usage.resetDate}.`;
}

/**
 * This month's Post to Pay orders against the store's limit (Henry, October 8; data from Aneesh's
 * monthly_usage action). The checkout backend counts and enforces the limit; an unknown count
 * says so instead of showing zero.
 */
export function MonthlyOrderUsage() {
  const { data: usage, isLoading, error } = useMonthlyOrderUsage();
  if (isLoading) return <div role="status" className="rounded-lg p-4 shadow-edge"><span className="sr-only">Checking this month's Post to Pay orders…</span><Skeleton className="h-4 w-48" /><Skeleton className="mt-3 h-1 w-full" /></div>;
  if (error) return <p className="rounded-lg p-4 text-sm text-muted-foreground shadow-edge">This month&apos;s Post to Pay order count is unavailable. Please reload to try again.</p>;
  // Nothing to count until Post to Pay checkout is set up for the store.
  if (!usage) return null;
  const share = Math.min(100, (usage.orders / usage.limit) * 100);
  const full = usage.orders >= usage.limit;
  const nearly = !full && usage.orders >= usage.limit * NEARLY_FULL;
  return (
    <section aria-labelledby="monthly-orders" className="space-y-3 rounded-lg p-4 shadow-edge">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 id="monthly-orders" className="text-sm font-semibold text-foreground">Post to Pay orders this month</h4>
      </div>
      <p className="text-sm text-body">
        <span className="text-base font-medium tabular-nums text-foreground">{usage.orders}</span> of {usage.limit}
      </p>
      <Progress value={share} aria-label={`${usage.orders} of ${usage.limit} Post to Pay orders used this month`}
        className={cn(full && '[&>div]:bg-destructive', nearly && '[&>div]:bg-warning')} />
      <p className={cn('text-xs', full ? 'text-destructive' : 'text-muted-foreground')}>{explain(usage)}</p>
    </section>
  );
}
