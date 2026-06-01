import { Badge } from '@/components/ui/badge';
import { VouchOrderStatus } from '@/types/vouch';
import { cn } from '@/lib/utils';

const statusConfig: Record<VouchOrderStatus, { label: string; className: string }> = {
  pending_delivery: {
    label: 'IN TRANSIT',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20',
  },
  delivered: {
    label: 'POSTING',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  post_pending: {
    label: 'POSTING',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  post_verified: {
    label: 'POSTED',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  charged: {
    label: 'CHARGED',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  // completed status is deprecated - orders end at either "posted" or "charged"
  completed: {
    label: 'POSTED',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

interface OrderStatusBadgeProps {
  status: VouchOrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={cn('w-24 justify-center whitespace-nowrap items-center leading-none px-3 h-[26px] rounded-lg', config.className)}>
      {config.label}
    </Badge>
  );
}
