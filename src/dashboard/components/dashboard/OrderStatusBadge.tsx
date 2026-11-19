import { Badge, type BadgeProps } from '@dashboard/components/ui/badge';
import type { VouchOrder } from '@dashboard/types/vouch';
import { postDueLabel } from '@dashboard/lib/format';
import { orderStage, STAGE_LABELS, type OrderStage } from '@dashboard/lib/orderStage';

type Variant = NonNullable<BadgeProps['variant']>;

const VARIANTS: Record<OrderStage, Variant> = {
  placed: 'default',
  in_transit: 'info',
  awaiting_post: 'warning',
  charge_pending: 'attention', // gray in the palette: nothing for the merchant to do; the label says what's happening
  posted: 'success',
  charged: 'destructive',
  cancelled: 'default',
};

/**
 * A gift's stage as a small tinted label. While a post is awaited and the deadline is known, the
 * label names the deadline instead ("Post due in 2 days"), so it says what happens next.
 */
export function OrderStatusBadge({ order }: { order: Pick<VouchOrder, 'status' | 'tracking_number' | 'post_deadline' | 'transaction'> }) {
  const stage = orderStage(order);
  if (stage === 'awaiting_post' && order.post_deadline) {
    return <Badge variant="warning">{postDueLabel(order.post_deadline).label}</Badge>;
  }
  return <Badge variant={VARIANTS[stage]}>{STAGE_LABELS[stage]}</Badge>;
}
