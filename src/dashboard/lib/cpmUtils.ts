import { orderStage } from './orderStage';
import { recordedAverage, recordedTotal } from './recordedMetrics';
import { giftCost, singleCurrency, formatMoney } from './dashboardMoney';
import { VouchPost, VouchOrder } from '@dashboard/types/vouch';
import { EMVSettings, EMV_DEFAULTS } from '@dashboard/hooks/useEMVSettings';

export const CPM_FORMULA = '(cost to brand ÷ views) × 1,000';

/** A gift counts as Posted once its post is verified or the order is completed (the "posted" stage). */
export function isPostedOrder(order: Pick<VouchOrder, 'status' | 'transaction'> | undefined): boolean {
  if (order?.transaction) return orderStage({ ...order, tracking_number: null, post_deadline: null }) === 'posted';
  return order?.status === 'post_verified' || order?.status === 'completed';
}

/**
 * CPM (cost per thousand views) for a post: what the gift cost the brand, per 1,000 views.
 * The cost is the gift's cost to brand (giftCost): for Post to Pay, the discount given.
 * Unavailable until the order carries what the creator paid.
 */
export function calculatePostCPM(post: VouchPost, order: VouchOrder | undefined): number | null {
  if (!order || !post.views || post.views === 0) return null;
  const cost = giftCost(order);
  if (cost === null || !singleCurrency([order])) return null;
  return (cost / post.views) * 1000;
}

/**
 * An influencer's average CPM across their posts that have one (posts without a known cost or views
 * are left out rather than counted as zero). Optionally limited to one brand's verified posts.
 */
export function getInfluencerAverageCPM(influencerId: string, posts: VouchPost[], orders: VouchOrder[], brandId?: string): number | null {
  if (!singleCurrency(orders)) return null;
  const cpms = posts
    .filter(p => p.influencer_id === influencerId && (!brandId || p.brand_id === brandId))
    .map(p => {
      const order = orders.find(o => o.id === p.order_id);
      if (brandId && !isPostedOrder(order)) return null;
      return calculatePostCPM(p, order);
    })
    .filter((cpm): cpm is number => cpm !== null);
  return cpms.length > 0 ? cpms.reduce((sum, cpm) => sum + cpm, 0) / cpms.length : null;
}

/**
 * Format CPM for display
 */
export function formatCPM(cpm: number | null, currency?: string | null): string {
  return formatMoney(cpm, currency);
}

/**
 * Calculate EMV (Earned Media Value) for a post.
 * Estimate using configured rates: total engagements × platform value per engagement (stored as "CPE")
 * - Instagram: $0.25 per engagement (default, customizable)
 * - TikTok: $0.20 per engagement (default, customizable)
 * "Engagement" = likes + comments
 * Unavailable (null) unless both likes and comments are recorded: counting a missing half as
 * zero would understate the value while looking like a real figure.
 */
export function calculatePostEMV(post: VouchPost, settings: EMVSettings = EMV_DEFAULTS): number | null {
  if (post.likes == null || post.comments == null) return null;
  const cpeRate = post.platform === 'instagram' ? settings.instagramCPE : settings.tiktokCPE;
  return (post.likes + post.comments) * cpeRate;
}

/** Complete total: any missing post engagement makes the total unavailable. An empty set is zero. */
export function totalPostEMV(posts: VouchPost[], settings: EMVSettings = EMV_DEFAULTS): number | null {
  return recordedTotal(posts.map(post => calculatePostEMV(post, settings)));
}

/** Complete average: unknown posts cannot silently disappear from its denominator. */
export function averagePostEMV(posts: VouchPost[], settings: EMVSettings = EMV_DEFAULTS): number | null {
  return recordedAverage(posts.map(post => calculatePostEMV(post, settings)));
}

const compactUSD = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 1, maximumFractionDigits: 1,
});

/**
 * EMV is an estimate in US dollars (the Settings rates are USD), shown like every other amount:
 * "$73.60", then compact from 1,000 ("$1.2K", "$1.0M"). Intl picks the unit after rounding,
 * so 999,960 reads "$1.0M", not "$1000.0K". Missing values become an em dash.
 */
export function formatEMV(emv: number | null | undefined): string {
  if (emv == null || !Number.isFinite(emv)) return '—';
  return Math.abs(emv) >= 1000 ? compactUSD.format(emv) : formatMoney(emv, 'USD');
}

/**
 * Check if an influencer has a posted gift for a specific brand
 * Only counts posts whose order is Posted (verified or completed), not charged
 */
export function hasPostedForBrand(influencerId: string, brandId: string, posts: VouchPost[], orders: VouchOrder[]): boolean {
  return posts.some(post => {
    if (post.influencer_id !== influencerId || post.brand_id !== brandId) return false;
    const order = orders.find(o => o.id === post.order_id);
    return isPostedOrder(order);
  });
}
