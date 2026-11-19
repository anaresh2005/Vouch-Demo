import { CloudOff } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Skeleton } from '@dashboard/components/ui/skeleton';
import { EmptyState } from './EmptyState';

/** The page shell while dashboard data loads, or a retryable error if it failed. */
export function DataStatus({ failed, retry }: { failed: boolean; retry: () => void }) {
  if (!failed) {
    return (
      <div role="status">
        <span className="sr-only">Loading dashboard data…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg p-4 shadow-edge">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-3 h-6 w-20" />
              <Skeleton className="mt-6 h-16 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      </div>
    );
  }
  return (
    <EmptyState
      role="alert"
      icon={CloudOff}
      title="Could not load dashboard data"
      description="Check your connection and try again."
      action={<Button variant="outline" onClick={retry}>Try again</Button>}
      className="mt-10"
    />
  );
}
