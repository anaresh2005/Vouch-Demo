import type { VouchOrder } from '@dashboard/types/vouch';

/** No conversion is inferred. Missing or mixed currencies cannot form a monetary total. */
export function singleCurrency(orders: Pick<VouchOrder, 'currency'>[]): string | null {
  const codes = new Set(orders.map(o => o.currency?.trim().toUpperCase()));
  if (codes.size !== 1) return null;
  const code = [...codes][0];
  return code && /^[A-Z]{3}$/.test(code) ? code : null;
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return '—';
  // A symbol, not the code (owner decision, October 24): "$80.00"; other currencies stay distinct ("CA$", "€").
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** How cost to brand is explained wherever it is shown (owner decision, October 24). */
export const COST_TO_BRAND_INFO = "The discount given: the products' retail value minus what the creator paid at checkout. It drops to $0 when a missed post's balance is collected, and a canceled order costs nothing. Shipping isn't included.";

/**
 * What a gift cost the brand. Post to Pay (owner decision, October 24): the products' retail value minus what was
 * paid for them at checkout, $0 once a missed post's balance is collected or the order is canceled. Older gifting
 * orders: discount plus shipping, from amounts supplied explicitly, never inferred from the order total.
 */
export function giftCost(order: VouchOrder): number | null {
  const t = order.transaction;
  if (t) {
    if (t.outcome === 'collected' || t.cancellation) return 0;
    const deposit = t.agreement.depositCents;
    return order.retail_total == null || deposit == null ? null : Math.max(order.retail_total - deposit / 100, 0);
  }
  if (order.retail_total == null || order.paid_total == null || order.shipping_cost == null) return null;
  return Math.max(order.retail_total - order.paid_total, 0) + order.shipping_cost;
}

export function moneyTotal(orders: VouchOrder[], field: 'retail_total' | 'paid_total' | 'order_total' | 'cogs'): number | null {
  if (!singleCurrency(orders) || !orders.every(o => o[field] != null && Number.isFinite(o[field]))) return null;
  return orders.reduce((total, o) => total + o[field]!, 0);
}
