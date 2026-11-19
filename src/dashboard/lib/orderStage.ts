import type { VouchOrder, VouchPost } from '@dashboard/types/vouch';

// Where a gift is, in the words a merchant uses. Derived from the stored order status plus the
// evidence on the order: a tracking number separates "placed" from "in transit", and a passed
// posting deadline means the creator is due to be charged (nobody is ever just "overdue").
// Henry's six stages plus Canceled (owner decisions, September 28 and October 24). Vouch's own checks (payment
// evidence, servicing, its reviews and settlement) are never a merchant-facing stage: a gift keeps its stage meanwhile.
export type OrderStage = 'placed' | 'in_transit' | 'awaiting_post' | 'charge_pending' | 'posted' | 'charged' | 'cancelled';

export function orderStage(order: Pick<VouchOrder, 'status' | 'tracking_number' | 'post_deadline' | 'transaction'>, now = Date.now()): OrderStage {
  const t = order.transaction;
  if (t) {
    // A store that removed Vouch before any outcome shows as canceled: nothing more is payable (October 24).
    if (t.cancellation || (t.conclusion && !t.outcome)) return 'cancelled';
    if (t.outcome === 'collected') return 'charged';
    if (t.outcome === 'waived') return 'posted';
    if (t.decision?.kind === 'missed') return 'charge_pending';
    // The brand sees a post only once Vouch's review has passed it; it shows as posted from then on.
    if (t.postDetectedAt || t.decision?.kind === 'approved') return 'posted';
    if (t.postingDeadlineAt && Date.parse(t.postingDeadlineAt) <= now) return 'charge_pending';
    if (t.delivery.deliveredAt) return 'awaiting_post';
    return t.servicing?.fulfillment === 'shipped' ? 'in_transit' : 'placed';
  }
  switch (order.status) {
    case 'pending_delivery':
      return order.tracking_number ? 'in_transit' : 'placed';
    case 'delivered':
    case 'post_pending':
      return order.post_deadline && new Date(order.post_deadline).getTime() <= now ? 'charge_pending' : 'awaiting_post';
    case 'post_verified':
    case 'completed':
      return 'posted';
    case 'charged':
      return 'charged';
  }
}

/**
 * Whether the gift has left the warehouse. Checkout transactions: delivered, a shipment Vouch saw, or
 * a tracking number. Legacy orders: anything past "placed".
 */
export function hasShipped(order: Pick<VouchOrder, 'status' | 'tracking_number' | 'post_deadline' | 'transaction' | 'delivered_at'>): boolean {
  const t = order.transaction;
  if (!t) return orderStage(order) !== 'placed';
  return !!order.delivered_at || t.servicing?.fulfillment === 'shipped' || !!order.tracking_number;
}

/**
 * When a finished gift finished: the post's detection time for a posted gift, the charge time for
 * a charged one. Null when the event time is missing or the gift is still in progress.
 * A later tracking/settings update is not evidence of when the gift finished.
 */
export function finishedAt(order: VouchOrder, post?: Pick<VouchPost, 'detected_at'> | null): string | null {
  const stage = orderStage(order);
  // A Post to Pay gift is posted once the brand can see its post (October 24), before Shopify confirms the outcome.
  if (order.transaction) return stage === 'posted' ? order.transaction.outcomeObservedAt ?? order.transaction.postDetectedAt
    : stage === 'charged' ? order.transaction.outcomeObservedAt : null;
  if (stage === 'posted') return post?.detected_at ?? null;
  if (stage === 'charged') return order.charged_at ?? null;
  return null;
}

export const STAGE_LABELS: Record<OrderStage, string> = {
  placed: 'Order placed',
  in_transit: 'In transit',
  awaiting_post: 'Awaiting post',
  charge_pending: 'Charge pending',
  posted: 'Posted',
  charged: 'Charged',
  cancelled: 'Canceled',
};

// Every stage, in the order a gift moves through them.
export const ORDER_STAGES = Object.keys(STAGE_LABELS) as OrderStage[];
