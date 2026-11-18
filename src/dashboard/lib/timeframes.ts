import { differenceInDays, endOfDay, startOfDay, subDays } from 'date-fns';
import type { Timeframe } from '@dashboard/hooks/useTimeframe';
import type { Period } from '@dashboard/lib/analytics';

export const TIMEFRAME_LABELS: Record<Exclude<Timeframe, 'custom'>, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last 12 months',
  lifetime: 'All time',
};

const DAYS: Record<Exclude<Timeframe, 'lifetime' | 'custom'>, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

/**
 * The chosen period and the one before it, of the same length (none for all time). Overview and
 * Analytics both use this, so "Last 7 days" covers the same days on every page.
 */
export function periodsFor(timeframe: Timeframe, custom: { from?: Date; to?: Date } = {}, now = new Date()): { current: Period; previous: Period | null } {
  if (timeframe === 'lifetime') return { current: { from: null, to: endOfDay(now) }, previous: null };
  if (timeframe === 'custom') {
    const from = startOfDay(custom.from ?? subDays(now, 30));
    const to = endOfDay(custom.to ?? now);
    const length = differenceInDays(to, from) + 1;
    return { current: { from, to }, previous: { from: startOfDay(subDays(from, length)), to: endOfDay(subDays(from, 1)) } };
  }
  const days = DAYS[timeframe];
  return {
    // "Last 7 days" is today and the six days before it; the previous period is the 7 days before that.
    current: { from: startOfDay(subDays(now, days - 1)), to: endOfDay(now) },
    previous: { from: startOfDay(subDays(now, days * 2 - 1)), to: endOfDay(subDays(now, days)) },
  };
}
