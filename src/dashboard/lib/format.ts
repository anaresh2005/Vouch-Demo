// Shared display formatting for dashboard numbers and dates.
import type { Influencer } from '@dashboard/types/vouch';

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * 12,900 → "12.9K", 1,420,000 → "1.4M"; missing values become an em dash. Intl picks the unit after
 * rounding, so 999,999 reads "1M" rather than "1000K".
 */
export function formatCompact(count: number | null | undefined): string {
  if (count === null || count === undefined || !Number.isFinite(count)) return '—';
  return compactNumber.format(count);
}

/** "Sep 27, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Sep 29, 2026, 11:59 PM": the app's date style with the time, for one-off events such as a sync. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * A date in a timeline: "Sep 29" (or "Sep 29, 11:59 PM" with the time) within the current year, and
 * with the year added otherwise ("Dec 30, 2025"), so an older gift's dates are never ambiguous.
 */
export function formatTimelineDate(iso: string, { time = false, now = new Date() }: { time?: boolean; now?: Date } = {}): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    ...(time && { hour: 'numeric', minute: '2-digit' }),
  });
}

/**
 * What an order awaiting a post needs, in words, as Stripe's badges name the action and the
 * deadline ("8 days to respond"): "Post due in 2 days" or "Post due in 5 hours". Once the deadline
 * passes the creator is charged, so callers show "Charge pending" instead (see orderStage).
 *
 * Under 48 hours the label counts hours (to the nearest hour), because "1 day" would cover anything
 * from 24 to 47 hours. From 48 hours it counts whole days, rounded down, so it never overstates.
 */
export function postDueLabel(deadline: string, now = Date.now()): { label: string; overdue: boolean } {
  const hours = (new Date(deadline).getTime() - now) / 3_600_000;
  if (hours <= 0) return { label: 'Post overdue', overdue: true };
  if (hours < 1) return { label: 'Post due in under an hour', overdue: false };
  if (hours < 48) {
    const whole = Math.round(hours);
    return { label: `Post due in ${whole} ${whole === 1 ? 'hour' : 'hours'}`, overdue: false };
  }
  return { label: `Post due in ${Math.floor(hours / 24)} days`, overdue: false };
}

/** The platform a creator used, with their handle and follower count on it. */
export function creatorOn(influencer: Influencer | null | undefined, platform: 'instagram' | 'tiktok') {
  const instagram = platform === 'instagram';
  return {
    handle: instagram ? influencer?.instagram_username : influencer?.tiktok_username,
    followers: instagram ? influencer?.instagram_followers : influencer?.tiktok_followers,
    engagement: instagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate,
  };
}
