import { VouchPost, VouchOrder } from '@/types/vouch';
import { EMVSettings, EMV_DEFAULTS } from '@/hooks/useEMVSettings';
import type { PriorityMetric } from '@/hooks/usePriorityMetric';
import { calculateAllAttributions, getMockSalesData, getInfluencerEstimatedSales, ATTRIBUTION_DEFAULTS } from '@/lib/attributionUtils';

/**
 * Calculate CPM (Cost Per Mille/Thousand Views) for a post
 * Formula: ((COGS + tax + shipping) / views) * 1000
 */
export function calculatePostCPM(post: VouchPost, order: VouchOrder | undefined): number | null {
  if (!order || !post.views || post.views === 0) return null;
  
  // Use COGS + tax + shipping instead of retail value
  const cost = (order.cogs || 0) + (order.sales_tax || 0) + (order.shipping_cost || 0);
  if (cost === 0) return null;
  
  return (cost / post.views) * 1000;
}

/**
 * Get the CPM threshold for top 10% performers
 * Lower CPM = better performance (more views per dollar spent)
 */
export function getTopPerformerCPMThreshold(posts: VouchPost[], orders: VouchOrder[]): number | null {
  const cpms: number[] = [];
  
  for (const post of posts) {
    const order = orders.find(o => o.id === post.order_id);
    const cpm = calculatePostCPM(post, order);
    if (cpm !== null && cpm > 0) {
      cpms.push(cpm);
    }
  }
  
  if (cpms.length === 0) return null;
  
  // Sort ascending (lower CPM is better)
  cpms.sort((a, b) => a - b);
  
  // Get 10th percentile index (top 10% means lowest 10% of CPMs)
  const percentileIndex = Math.ceil(cpms.length * 0.1) - 1;
  return cpms[Math.max(0, percentileIndex)];
}

/**
 * Get set of influencer IDs that are top performers (CPM-only, legacy)
 */
export function getTopPerformerIds(posts: VouchPost[], orders: VouchOrder[]): Set<string> {
  const threshold = getTopPerformerCPMThreshold(posts, orders);
  if (threshold === null) return new Set();
  
  const topPerformerIds = new Set<string>();
  
  for (const post of posts) {
    const order = orders.find(o => o.id === post.order_id);
    const cpm = calculatePostCPM(post, order);
    if (cpm !== null && cpm <= threshold) {
      topPerformerIds.add(post.influencer_id);
    }
  }
  
  return topPerformerIds;
}

/**
 * Get set of influencer IDs that are top 10% performers based on a chosen metric.
 * - cpm: lowest 10% CPM (lower = better)
 * - emv: highest 10% average EMV per post
 * - sales: highest 10% estimated attributed revenue
 */
export function getTopPerformerIdsByMetric(
  posts: VouchPost[],
  orders: VouchOrder[],
  metric: PriorityMetric,
  emvSettings: EMVSettings = EMV_DEFAULTS
): Set<string> {
  // Collect unique influencer IDs that have posts
  const influencerIds = [...new Set(posts.map(p => p.influencer_id))];
  if (influencerIds.length === 0) return new Set();

  const scored: { id: string; value: number }[] = [];

  if (metric === 'cpm') {
    for (const id of influencerIds) {
      const best = getInfluencerBestCPM(id, posts, orders);
      if (best !== null) scored.push({ id, value: best });
    }
    // Lower CPM is better — sort ascending, take bottom 10%
    scored.sort((a, b) => a.value - b.value);
  } else if (metric === 'emv') {
    for (const id of influencerIds) {
      const infPosts = posts.filter(p => p.influencer_id === id);
      if (infPosts.length === 0) continue;
      const avgEMV = infPosts.reduce((s, p) => s + calculatePostEMV(p, emvSettings), 0) / infPosts.length;
      scored.push({ id, value: avgEMV });
    }
    // Higher EMV is better — sort descending, take top 10%
    scored.sort((a, b) => b.value - a.value);
  } else {
    // sales
    const salesData = getMockSalesData();
    const allAttributions = calculateAllAttributions(posts, orders, salesData, ATTRIBUTION_DEFAULTS);
    for (const id of influencerIds) {
      const est = getInfluencerEstimatedSales(id, allAttributions);
      scored.push({ id, value: est });
    }
    // Higher sales is better — sort descending, take top 10%
    scored.sort((a, b) => b.value - a.value);
  }

  if (scored.length === 0) return new Set();
  const cutoff = Math.max(1, Math.ceil(scored.length * 0.1));
  return new Set(scored.slice(0, cutoff).map(s => s.id));
}

/**
 * Check if a specific influencer is a top performer based on the priority metric.
 */
export function isTopPerformer(
  influencerId: string,
  posts: VouchPost[],
  orders: VouchOrder[],
  metric: PriorityMetric = 'cpm',
  emvSettings: EMVSettings = EMV_DEFAULTS
): boolean {
  const topIds = getTopPerformerIdsByMetric(posts, orders, metric, emvSettings);
  return topIds.has(influencerId);
}

/**
 * Get the best (lowest) CPM for an influencer across all their posts
 */
export function getInfluencerBestCPM(influencerId: string, posts: VouchPost[], orders: VouchOrder[]): number | null {
  const influencerPosts = posts.filter(p => p.influencer_id === influencerId);
  if (influencerPosts.length === 0) return null;
  
  let bestCPM: number | null = null;
  
  for (const post of influencerPosts) {
    const order = orders.find(o => o.id === post.order_id);
    const cpm = calculatePostCPM(post, order);
    if (cpm !== null && (bestCPM === null || cpm < bestCPM)) {
      bestCPM = cpm;
    }
  }
  
  return bestCPM;
}

/**
 * Format CPM for display
 */
export function formatCPM(cpm: number | null): string {
  if (cpm === null) return '—';
  if (cpm < 1) return `$${cpm.toFixed(2)}`;
  return `$${cpm.toFixed(2)}`;
}

/**
 * Calculate EMV (Earned Media Value) for a post.
 * Industry-standard formula: total engagements × platform CPE rate
 * - Instagram: $0.25 per engagement (default, customizable)
 * - TikTok: $0.20 per engagement (default, customizable)
 * "Engagement" = likes + comments
 */
export function calculatePostEMV(post: VouchPost, settings: EMVSettings = EMV_DEFAULTS): number {
  const engagements = (post.likes || 0) + (post.comments || 0);
  const cpeRate = post.platform === 'instagram' ? settings.instagramCPE : settings.tiktokCPE;
  return engagements * cpeRate;
}

/**
 * Format EMV for display
 */
export function formatEMV(emv: number): string {
  if (emv >= 1000000) return `$${(emv / 1000000).toFixed(2)}M`;
  if (emv >= 1000) return `$${(emv / 1000).toFixed(1)}K`;
  return `$${emv.toFixed(2)}`;
}

/**
 * Get aggregate EMV for an influencer across all their posts
 */
export function getInfluencerTotalEMV(influencerId: string, posts: VouchPost[], settings: EMVSettings = EMV_DEFAULTS): number {
  return posts
    .filter(p => p.influencer_id === influencerId)
    .reduce((sum, p) => sum + calculatePostEMV(p, settings), 0);
}

/**
 * Check if an influencer has posted for Vouch at least once
 */
export function hasPostedForVouch(influencerId: string, posts: VouchPost[]): boolean {
  return posts.some(post => post.influencer_id === influencerId);
}

/**
 * Check if an influencer has a verified post for a specific brand
 * Only counts posts where the order status is 'post_verified' (not 'charged')
 */
export function hasPostedForBrand(influencerId: string, brandId: string, posts: VouchPost[], orders: VouchOrder[]): boolean {
  return posts.some(post => {
    if (post.influencer_id !== influencerId || post.brand_id !== brandId) return false;
    const order = orders.find(o => o.id === post.order_id);
    // Only count posts where order is post_verified (not charged)
    return order?.status === 'post_verified';
  });
}

/**
 * Get the best (lowest) CPM for an influencer for a specific brand
 * Only considers posts where the order status is 'post_verified'
 */
export function getInfluencerBestCPMForBrand(
  influencerId: string, 
  brandId: string, 
  posts: VouchPost[], 
  orders: VouchOrder[]
): number | null {
  const influencerBrandPosts = posts.filter(p => {
    if (p.influencer_id !== influencerId || p.brand_id !== brandId) return false;
    const order = orders.find(o => o.id === p.order_id);
    // Only include posts where order is post_verified (not charged)
    return order?.status === 'post_verified';
  });
  
  if (influencerBrandPosts.length === 0) return null;
  
  let bestCPM: number | null = null;
  
  for (const post of influencerBrandPosts) {
    const order = orders.find(o => o.id === post.order_id);
    const cpm = calculatePostCPM(post, order);
    if (cpm !== null && (bestCPM === null || cpm < bestCPM)) {
      bestCPM = cpm;
    }
  }
  
  return bestCPM;
}
