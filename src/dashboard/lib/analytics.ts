// Analytics, worked out from recorded orders and posts only. Anything that can't be known yet
// (what creators paid, and so cost to brand and CPM) is null rather than zero.
import { addDays, addWeeks, differenceInCalendarDays, startOfDay } from 'date-fns';
import { giftCost, singleCurrency, moneyTotal } from './dashboardMoney';
export { giftCost } from './dashboardMoney';
import { calculatePostCPM, totalPostEMV } from '@dashboard/lib/cpmUtils';
import { recordedTotal } from './recordedMetrics';
import { compareMissingLast } from './sort';
import { creatorOn } from '@dashboard/lib/format';
import { orderStage } from '@dashboard/lib/orderStage';
import type { EMVSettings } from '@dashboard/hooks/useEMVSettings';
import type { VouchOrder, VouchPost } from '@dashboard/types/vouch';

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** A period; `from` is null for all time. */
export type Period = { from: Date | null; to: Date };

export const inPeriod = (iso: string | null | undefined, period: Period) => {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return (period.from === null || time >= period.from.getTime()) && time <= period.to.getTime();
};
const mean = (values: number[]) => (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null);
const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const FOLLOWER_TIERS = [
  { label: 'Under 5K', min: 0, max: 5_000 },
  { label: '5K–10K', min: 5_000, max: 10_000 },
  { label: '10K–50K', min: 10_000, max: 50_000 },
  { label: '50K+', min: 50_000, max: Infinity },
];

/**
 * Chart buckets from the period start (or the first record's day, for all time) to its end: a day
 * each for periods of two weeks or less, otherwise a week each. The first bucket starts on the
 * period's first day; the last may be a partial week ending today.
 */
export function buckets(period: Period, dates: string[]) {
  const end = period.to.getTime() + 1;
  const first = period.from ?? startOfDay(Math.min(...dates.map(d => new Date(d).getTime()), period.to.getTime() - WEEK));
  const size: 'day' | 'week' = differenceInCalendarDays(period.to, first) < 14 ? 'day' : 'week';
  const result: { start: number; end: number; label: string }[] = [];
  for (let start = first; start.getTime() < end; start = size === 'day' ? addDays(start, 1) : addWeeks(start, 1)) {
    const next = size === 'day' ? addDays(start, 1) : addWeeks(start, 1);
    result.push({ start: start.getTime(), end: Math.min(next.getTime(), end), label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
  }
  return { size, buckets: result };
}

export function summarize(orders: VouchOrder[], posts: VouchPost[], period: Period, emv: EMVSettings) {
  const currency = singleCurrency(orders);
  const cpmFor = (p: VouchPost, order: VouchOrder | undefined) => currency ? calculatePostCPM(p, order) : null;
  const gifts = orders.filter(o => inPeriod(o.created_at, period));
  const periodPosts = posts.filter(p => inPeriod(p.detected_at, period));
  const orderFor = (post: VouchPost) => orders.find(o => o.id === post.order_id);
  const stages = gifts.map(order => orderStage(order));
  const count = (...wanted: string[]) => stages.filter(s => wanted.includes(s)).length;

  // Gifts: spend and outcomes.
  const costs = gifts.map(giftCost);
  const costKnown = currency !== null && gifts.length > 0 && costs.every(c => c !== null);
  const costToBrand = costKnown ? sum(costs as number[]) : null;
  const posted = count('posted');
  const charged = count('charged');
  const resolved = posted + charged;
  const delivered = gifts.filter(g => g.transaction ? !!g.delivered_at : ['awaiting_post', 'charge_pending', 'posted', 'charged'].includes(orderStage(g))).length;
  const daysToPost = periodPosts.flatMap(post => {
    const deliveredAt = orderFor(post)?.delivered_at;
    return deliveredAt ? [(new Date(post.detected_at).getTime() - new Date(deliveredAt).getTime()) / DAY] : [];
  }).filter(days => days >= 0);
  // Both charts share one set of buckets, so their dates line up.
  const chart = buckets(period, [...gifts.map(g => g.created_at), ...periodPosts.map(p => p.detected_at)]);
  const inBucket = (iso: string, b: { start: number; end: number }) => { const t = new Date(iso).getTime(); return t >= b.start && t < b.end; };

  // Posts: attention and efficiency.
  const cpms = periodPosts.map(p => cpmFor(p, orderFor(p))).filter((c): c is number => c !== null);
  const engagementRates = periodPosts.map(p => p.engagement_rate).filter((r): r is number => r !== null && r !== undefined);

  // Creators: who gives the best value. A creator counts if they were gifted or posted in the
  // period (a post often lands in a later period than its gift).
  const creatorIds = [...new Set([...gifts.map(g => g.influencer_id), ...periodPosts.map(p => p.influencer_id)])];
  const creatorRows = creatorIds.map(id => {
    const theirGifts = gifts.filter(g => g.influencer_id === id);
    const theirPosts = periodPosts.filter(p => p.influencer_id === id);
    const theirCpms = theirPosts.map(p => cpmFor(p, orderFor(p))).filter((c): c is number => c !== null);
    const source = theirGifts[0] ?? orderFor(theirPosts[0]) ?? theirPosts[0];
    const platform = source.platform;
    return {
      id, influencer: source.influencer, platform, followers: creatorOn(source.influencer, platform).followers ?? null,
      engagementRate: creatorOn(source.influencer, platform).engagement ?? null,
      gifts: theirGifts.length, posts: theirPosts.length,
      views: recordedTotal(theirPosts.map(p => p.views)),
      avgCpm: mean(theirCpms),
      resolved: theirGifts.filter(g => ['posted', 'charged'].includes(orderStage(g))).length,
      posted: theirGifts.filter(g => orderStage(g) === 'posted').length,
    };
  });
  const followerCounts = creatorRows.map(c => c.followers);
  const totalFollowers = followerCounts.length > 0 && followerCounts.every((n): n is number => n !== null)
    ? sum(followerCounts) : null;
  const engagementRatesForCreators = creatorRows.map(c => c.engagementRate);
  const avgCreatorEngagementRate = engagementRatesForCreators.length > 0 && engagementRatesForCreators.every((n): n is number => n !== null)
    ? mean(engagementRatesForCreators) : null;
  const tiers = FOLLOWER_TIERS.map(tier => {
    const rows = creatorRows.filter(c => c.followers !== null && c.followers >= tier.min && c.followers < tier.max);
    const tierPosts = sum(rows.map(r => r.posts));
    const tierViews = recordedTotal(rows.map(r => r.views));
    const tierCpms = periodPosts
      .filter(p => rows.some(r => r.id === p.influencer_id))
      .map(p => cpmFor(p, orderFor(p))).filter((c): c is number => c !== null);
    const resolvedCount = sum(rows.map(r => r.resolved));
    return {
      label: tier.label,
      creators: rows.length,
      avgViewsPerPost: tierPosts > 0 && tierViews !== null ? tierViews / tierPosts : null,
      avgCpm: mean(tierCpms),
      postRate: resolvedCount > 0 ? sum(rows.map(r => r.posted)) / resolvedCount : null,
    };
  });

  return {
    currency,
    /** Whether each chart point is a day or a week. */
    bucketSize: chart.size,
    gifts: {
      sent: gifts.length,
      retail: moneyTotal(gifts, 'retail_total'),
      costToBrand,
      costPerGift: costToBrand !== null && gifts.length > 0 ? costToBrand / gifts.length : null,
      postRate: resolved > 0 ? posted / resolved : null,
      // A legacy status is not evidence of the amount collected.
      recovered: null as number | null,
      avgDaysToPost: mean(daysToPost),
      funnel: [
        { label: 'Gifts sent', value: gifts.length },
        { label: 'Delivered', value: delivered },
        { label: 'Posted', value: posted },
      ],
      charged,
      series: chart.buckets.map(b => ({ label: b.label, value: gifts.filter(g => inBucket(g.created_at, b)).length })),
    },
    posts: {
      count: periodPosts.length,
      views: recordedTotal(periodPosts.map(p => p.views)),
      engagements: recordedTotal(periodPosts.flatMap(p => [p.likes, p.comments])),
      avgEngagementRate: mean(engagementRates),
      avgCpm: mean(cpms),
      // Incomplete engagement data cannot produce a complete EMV total.
      emv: totalPostEMV(periodPosts, emv),
      adReady: periodPosts.filter(p => p.boosting_rights_granted).length,
      series: chart.buckets.map(b => ({ label: b.label, value: recordedTotal(periodPosts.filter(p => inBucket(p.detected_at, b)).map(p => p.views)) })),
      top: [...periodPosts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5)
        .map(post => ({ post, cpm: cpmFor(post, orderFor(post)) })),
    },
    creators: {
      count: creatorIds.length,
      totalFollowers,
      avgFollowers: totalFollowers === null ? null : totalFollowers / creatorIds.length,
      avgEngagementRate: avgCreatorEngagementRate,
      repeat: creatorRows.filter(c => c.gifts > 1).length,
      medianFollowers: median(creatorRows.map(c => c.followers).filter((f): f is number => f !== null)),
      instagram: creatorRows.filter(c => c.platform === 'instagram').length,
      tiktok: creatorRows.filter(c => c.platform === 'tiktok').length,
      tiers,
      top: [...creatorRows].filter(c => c.posts > 0)
        .sort((a, b) => (a.avgCpm ?? Infinity) - (b.avgCpm ?? Infinity) || compareMissingLast(a.views, b.views, 'desc')).slice(0, 5),
      // The report exports list creators by views, the figure they show.
      topByViews: [...creatorRows].filter(c => c.posts > 0).sort((a, b) => compareMissingLast(a.views, b.views, 'desc')).slice(0, 5),
    },
  };
}

export type AnalyticsSummary = ReturnType<typeof summarize>;

/** Percentage change from a previous value, or null when there's nothing fair to compare with. */
export function change(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
