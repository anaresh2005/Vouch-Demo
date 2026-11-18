import type { CheckoutAgreementLine, CheckoutDashboardRow, CheckoutTransaction } from '@dashboard/types/checkout';
import type { Influencer, VouchOrder } from '@dashboard/types/vouch';
const numericId = (id: string | null) => id?.replace('gid://shopify/Order/', '');

/** The products an accepted offer covers: every line of a whole cart, or the one product of an earlier offer. */
export function agreementLines(agreement: CheckoutTransaction['agreement']): CheckoutAgreementLine[] {
  if (agreement.lines) return agreement.lines;
  const quantity = agreement.quantity ?? 1;
  return [{ title: agreement.title ?? 'Product', variantTitle: agreement.variantTitle ?? '', quantity,
    lineSubtotalCents: (agreement.priceCents ?? 0) * quantity }];
}

/** Display projection only: no second persisted order or fabricated product payment amounts. */
export function mergeCheckoutOrders(legacy: VouchOrder[], rows: CheckoutDashboardRow[]): VouchOrder[] {
  const ids = new Set(rows.map(r => numericId(r.transaction.orderId)));
  return [...legacy.filter(o => !ids.has(numericId(o.shopify_order_id))), ...rows.map(row => {
    const t = row.transaction;
    const duplicates = legacy.filter(o => numericId(o.shopify_order_id) === numericId(t.orderId));
    const known = legacy.find(o => o.influencer?.instagram_username?.toLowerCase() === row.username.toLowerCase())?.influencer;
    const photo = row.profile.photo ?? null;
    const creator: Influencer = known ? { ...known, profile_image_url: known.profile_image_url ?? photo, category: known.category ?? row.profile.category ?? null } : {
      id: `instagram:${row.username.toLowerCase()}`, full_name: row.profile.displayName,
      instagram_username: row.username, instagram_followers: row.profile.followers,
      instagram_engagement_rate: row.profile.engagement, instagram_verified: false,
      tiktok_username: null, tiktok_followers: null, tiktok_engagement_rate: null, tiktok_verified: false,
      email: '', phone: null, bio: null, category: row.profile.category ?? null, profile_image_url: photo,
      sponsored_posts_30d: null, stripe_customer_id: null, created_at: t.acceptedAt, updated_at: t.acceptedAt,
    };
    return {
      id: row.id, brand_id: row.brandId, influencer_id: creator.id, influencer: creator,
      platform: 'instagram', created_at: t.acceptedAt, updated_at: t.reconciledAt ?? t.acceptedAt,
      shopify_order_id: numericId(t.orderId)!, shopDomain: row.shopDomain,
      status: t.outcome === 'waived' && t.payment?.verified ? 'completed' :
        t.outcome === 'collected' && t.payment?.verified ? 'charged' : t.delivery.deliveredAt ? 'post_pending' : 'pending_delivery',
      delivered_at: t.delivery.deliveredAt, post_deadline: t.postingDeadlineAt,
      charged_at: t.outcome === 'collected' ? t.outcomeObservedAt : null,
      currency: t.payment?.currency ?? 'USD', order_total: (t.payment?.totalCents ?? Number.NaN) / 100,
      retail_total: agreementLines(t.agreement).reduce((sum, l) => sum + l.lineSubtotalCents, 0) / 100, paid_total: null, shipping_cost: null, sales_tax: null,
      cogs: null, items_count: agreementLines(t.agreement).reduce((sum, l) => sum + l.quantity, 0), stripe_payment_intent_id: null, estimated_delivery_at: null,
      tracking_number: t.servicing?.tracking?.number ?? null, shipping_carrier: t.servicing?.tracking?.company ?? null, transaction: t, legacyOrderIds: duplicates.map(o => o.id),
    } satisfies VouchOrder;
  })].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
