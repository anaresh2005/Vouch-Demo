import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@dashboard/lib/utils';

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: 'note' | 'status' | 'alert';
};

// Every view answers "nothing here yet" on purpose: a dashed box with a small icon, a one-line
// headline, one sentence of explanation, and at most one next step.
export function EmptyState({ icon: Icon, title, description, action, className, role }: Props) {
  return (
    <div role={role} className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center', className)}>
      {Icon && (
        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A small "No data" pill inside a dashed box, for a card or chart with nothing to show yet. */
export function NoData({ label = 'No data', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-border', className)}>
      <span className="rounded-md bg-secondary px-2 py-1 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
