import { VouchPost, VouchOrder } from '@/types/vouch';
import { mockOrderItems } from '@/lib/mockData';

export interface ProductSalesDay {
  date: string; // ISO date string YYYY-MM-DD
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface AttributionResult {
  postId: string;
  influencerId: string;
  productIds: string[];
  productNames: string[];
  baselineDailyRevenue: number;   // 7-day avg pre-post
  windowRevenue: number;          // revenue in attribution window
  attributedRevenue: number;      // lift above expected baseline
  liftPercent: number;            // % above baseline
  confidenceScore: number;        // 0-100
  spikeDetected: boolean;
  attributionWindowHours: number;
  minSpikeThreshold: number;      // % threshold used
}

export interface AttributionSettings {
  attributionWindowHours: number;
  minSpikeThreshold: number;
}

export const ATTRIBUTION_DEFAULTS: AttributionSettings = {
  attributionWindowHours: 72,
  minSpikeThreshold: 20,
};

// ─── Mock Sales Data ────────────────────────────────────────────────────────
// Time-series of daily product sales, with spikes seeded around post dates.

const now = new Date();
const ms = (days: number) => days * 24 * 60 * 60 * 1000;

function isoDay(offset: number): string {
  const d = new Date(now.getTime() - ms(offset));
  return d.toISOString().slice(0, 10);
}

// Products present in mock orders
const PRODUCTS: Record<string, string> = {
  '7654321098765': 'Silk Blend Midi Dress',
  '7654321098766': 'Leather Crossbody Bag',
  '7654321098767': 'Gold Hoop Earrings',
  '7654321098768': 'Cashmere Sweater',
  '7654321098769': 'Vintage Sunglasses',
  '7654321098770': 'Leather Belt',
  '7654321098771': 'Yoga Mat Premium',
  '7654321098772': 'Resistance Band Set',
  '7654321098773': 'Silk Scarf',
};

// post-1 (tiktok, liam): detected ~2 days ago + 18h → ~1.25 days ago
// post-2 (instagram, brandon): detected ~12 days ago + 48h → ~10 days ago
// post-3 (instagram, bryce): detected ~10 days ago + 36h → ~8.5 days ago

function makeSalesHistory(): ProductSalesDay[] {
  const rows: ProductSalesDay[] = [];

  // Helper: add a row
  const add = (dayOffset: number, productId: string, units: number, pricePerUnit: number) => {
    rows.push({
      date: isoDay(dayOffset),
      productId,
      productName: PRODUCTS[productId],
      unitsSold: units,
      revenue: units * pricePerUnit,
    });
  };

  // ── Silk Blend Midi Dress (7654321098765) ──
  // Baseline: ~3 units/day → spike after post-1 (~1.25 days ago) and post-2 (~10 days ago)
  for (let d = 30; d > 1.5; d--) {
    // Spike window for post-2 (10 days ago): days 10, 9, 8 → big spike
    const nearPost2 = d >= 8 && d <= 11;
    const units = nearPost2 ? Math.round(3 + Math.random() * 12 + 10) : Math.round(2 + Math.random() * 2);
    add(d, '7654321098765', units, 89.99);
  }
  // Very recent spike for post-1
  add(1, '7654321098765', 18, 89.99);
  add(0, '7654321098765', 14, 89.99);

  // ── Gold Hoop Earrings (7654321098767) ──
  // post-1 features this item in order-1 but no post detected yet; modest baseline
  for (let d = 30; d >= 0; d--) {
    add(d, '7654321098767', Math.round(1 + Math.random() * 2), 35.00);
  }

  // ── Cashmere Sweater (7654321098768) ──
  // Featured in post-2 (brandon, ~10 days ago) and post-3 (bryce, ~8.5 days ago)
  for (let d = 30; d > 11; d--) {
    add(d, '7654321098768', Math.round(2 + Math.random() * 2), 129.00);
  }
  // Spike around post-2 (day 10)
  add(11, '7654321098768', 4, 129.00);
  add(10, '7654321098768', 22, 129.00);
  add(9, '7654321098768', 18, 129.00);
  add(8, '7654321098768', 16, 129.00); // overlaps with post-3 (day 8.5)
  add(7, '7654321098768', 12, 129.00);
  add(6, '7654321098768', 8, 129.00);
  add(5, '7654321098768', 5, 129.00);
  for (let d = 4; d >= 0; d--) {
    add(d, '7654321098768', Math.round(2 + Math.random() * 2), 129.00);
  }

  // ── Vintage Sunglasses (7654321098769) ──
  // Featured in post-3 (bryce, ~8.5 days ago)
  for (let d = 30; d > 9; d--) {
    add(d, '7654321098769', Math.round(1 + Math.random() * 2), 45.00);
  }
  // Spike around post-3 (day 8.5)
  add(9, '7654321098769', 3, 45.00);
  add(8, '7654321098769', 14, 45.00);
  add(7, '7654321098769', 11, 45.00);
  add(6, '7654321098769', 9, 45.00);
  for (let d = 5; d >= 0; d--) {
    add(d, '7654321098769', Math.round(1 + Math.random() * 2), 45.00);
  }

  // ── Leather Belt (7654321098770) ──
  for (let d = 30; d >= 0; d--) {
    add(d, '7654321098770', Math.round(1 + Math.random() * 2), 35.00);
  }

  // ── Leather Crossbody Bag (7654321098766) ──
  for (let d = 30; d >= 0; d--) {
    add(d, '7654321098766', Math.round(1 + Math.random() * 2), 65.00);
  }

  // ── Yoga Mat (7654321098771) ──
  for (let d = 30; d >= 0; d--) {
    add(d, '7654321098771', Math.round(1 + Math.random() * 1), 79.00);
  }

  // ── Silk Scarf (7654321098773) ──
  for (let d = 30; d >= 0; d--) {
    add(d, '7654321098773', Math.round(1 + Math.random() * 2), 55.00);
  }

  return rows;
}

// Singleton — stable across renders
let _salesData: ProductSalesDay[] | null = null;
export function getMockSalesData(): ProductSalesDay[] {
  if (!_salesData) _salesData = makeSalesHistory();
  return _salesData;
}

// ─── Attribution Calculation ─────────────────────────────────────────────────

/**
 * Get the featured product IDs for a post (auto from the order's items).
 */
export function getFeaturedProducts(
  post: VouchPost,
  orders: VouchOrder[]
): { id: string; name: string }[] {
  const order = orders.find(o => o.id === post.order_id);
  if (!order) return [];
  const items = mockOrderItems[order.id] || [];
  const seen = new Set<string>();
  return items
    .filter(item => item.shopify_product_id && !seen.has(item.shopify_product_id) && seen.add(item.shopify_product_id!))
    .map(item => ({ id: item.shopify_product_id!, name: item.name }));
}

/**
 * Calculate 7-day baseline daily revenue for a product before a given date.
 */
function calculateBaseline(
  productId: string,
  postDate: Date,
  salesData: ProductSalesDay[]
): number {
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  const from = new Date(postDate.getTime() - windowMs);

  const relevant = salesData.filter(row => {
    if (row.productId !== productId) return false;
    const d = new Date(row.date);
    return d >= from && d < postDate;
  });

  if (relevant.length === 0) return 0;
  return relevant.reduce((s, r) => s + r.revenue, 0) / 7;
}

/**
 * Calculate total revenue in the attribution window after a post.
 */
function calculateWindowRevenue(
  productId: string,
  postDate: Date,
  windowHours: number,
  salesData: ProductSalesDay[]
): number {
  const windowMs = windowHours * 60 * 60 * 1000;
  const to = new Date(postDate.getTime() + windowMs);

  return salesData
    .filter(row => {
      if (row.productId !== productId) return false;
      const d = new Date(row.date);
      return d >= postDate && d <= to;
    })
    .reduce((s, r) => s + r.revenue, 0);
}

/**
 * Virality multiplier: if post views are significantly above 50k baseline.
 */
function viralityMultiplier(post: VouchPost): number {
  const views = post.views || 0;
  if (views > 100000) return 1.3;
  if (views > 50000) return 1.15;
  return 1.0;
}

/**
 * Calculate full attribution for a single post.
 */
export function calculateAttribution(
  post: VouchPost,
  orders: VouchOrder[],
  salesData: ProductSalesDay[],
  settings: AttributionSettings = ATTRIBUTION_DEFAULTS
): AttributionResult {
  const products = getFeaturedProducts(post, orders);
  const postDate = new Date(post.detected_at);

  let totalBaseline = 0;
  let totalWindowRevenue = 0;

  for (const product of products) {
    const windowDays = settings.attributionWindowHours / 24;
    const baseline = calculateBaseline(product.id, postDate, salesData) * windowDays;
    const window = calculateWindowRevenue(product.id, postDate, settings.attributionWindowHours, salesData);
    totalBaseline += baseline;
    totalWindowRevenue += window;
  }

  const attributedRevenue = Math.max(0, totalWindowRevenue - totalBaseline);
  const liftPercent = totalBaseline > 0
    ? ((totalWindowRevenue - totalBaseline) / totalBaseline) * 100
    : totalWindowRevenue > 0 ? 100 : 0;

  const spikeDetected = liftPercent >= settings.minSpikeThreshold && attributedRevenue > 0;

  // Confidence: based on lift magnitude, capped by virality multiplier
  const rawConfidence = Math.min(1, liftPercent / 150); // 150% lift = 100% confidence
  const confidence = Math.min(100, Math.round(rawConfidence * viralityMultiplier(post) * 100));

  return {
    postId: post.id,
    influencerId: post.influencer_id,
    productIds: products.map(p => p.id),
    productNames: products.map(p => p.name),
    baselineDailyRevenue: totalBaseline,
    windowRevenue: totalWindowRevenue,
    attributedRevenue,
    liftPercent,
    confidenceScore: spikeDetected ? Math.max(confidence, 10) : confidence,
    spikeDetected,
    attributionWindowHours: settings.attributionWindowHours,
    minSpikeThreshold: settings.minSpikeThreshold,
  };
}

/**
 * Calculate attribution for all posts.
 */
export function calculateAllAttributions(
  posts: VouchPost[],
  orders: VouchOrder[],
  salesData: ProductSalesDay[],
  settings: AttributionSettings = ATTRIBUTION_DEFAULTS
): AttributionResult[] {
  return posts.map(post => calculateAttribution(post, orders, salesData, settings));
}

/**
 * Get total attributed revenue for an influencer across all their posts.
 */
export function getInfluencerAttributedRevenue(
  influencerId: string,
  attributions: AttributionResult[]
): number {
  return attributions
    .filter(a => a.influencerId === influencerId && a.spikeDetected)
    .reduce((s, a) => s + a.attributedRevenue, 0);
}

/**
 * Estimated Sales Driven formula.
 *
 * Rationale: after the attribution window closes, sales don't drop to zero — they
 * decay back toward baseline following a long-tail curve. The shape of the tail
 * scales with the *size* of the original spike:
 *
 *   - Small spikes  (lift <  50 %) → short tail: 1.10× multiplier
 *   - Medium spikes (lift  50-150%) → medium tail: 1.25×
 *   - Large spikes  (lift 150-400%) → long tail:  1.45×
 *   - Viral spikes  (lift > 400 %)  → viral tail:  1.65×
 *
 * These multipliers approximate the integral of an exponential decay function
 * over a 30-day window for each tier.  The confidence score is then applied as
 * a discount factor so low-confidence attributions contribute proportionally less.
 *
 * Formula per post:
 *   tailMultiplier = f(liftPercent)
 *   estimatedSales = attributedRevenue × tailMultiplier × (confidenceScore / 100)
 *
 * Total = sum across all spiked posts for the influencer.
 */
export function getTailMultiplier(liftPercent: number): number {
  if (liftPercent > 400) return 1.65;
  if (liftPercent > 150) return 1.45;
  if (liftPercent > 50)  return 1.25;
  return 1.10;
}

export function getInfluencerEstimatedSales(
  influencerId: string,
  attributions: AttributionResult[]
): number {
  return attributions
    .filter(a => a.influencerId === influencerId && a.spikeDetected)
    .reduce((sum, a) => {
      const tail = getTailMultiplier(a.liftPercent);
      const confidence = a.confidenceScore / 100;
      return sum + a.attributedRevenue * tail * confidence;
    }, 0);
}

/**
 * Get per-day sales for a product over the last N days (for timeline chart).
 */
export function getProductSalesTimeline(
  productId: string,
  salesData: ProductSalesDay[],
  days: number = 30
): { date: string; revenue: number; label: string }[] {
  const result: { date: string; revenue: number; label: string }[] = [];
  for (let d = days; d >= 0; d--) {
    const date = isoDay(d);
    const revenue = salesData
      .filter(r => r.productId === productId && r.date === date)
      .reduce((s, r) => s + r.revenue, 0);
    result.push({
      date,
      revenue,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return result;
}

export function formatAttribution(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${Math.round(value)}`;
}
