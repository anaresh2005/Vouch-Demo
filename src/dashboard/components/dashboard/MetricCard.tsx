import type { ReactNode } from 'react';
import { InfoTip } from '@dashboard/components/ui/info-tip';
import { cn } from '@dashboard/lib/utils';
import { Sparkline } from './Sparkline';
import { NoData } from './EmptyState';

type Props = {
  title: string;
  /** Extra words after the title, e.g. " · no posts yet". Part of the same label for screen readers. */
  titleNote?: string;
  info?: ReactNode;
  value: string;
  /** Percentage change against the previous period, or null when there is nothing fair to compare. */
  trend?: number | null;
  comparison?: string;
  series?: number[];
  empty?: boolean;
};

// An overview card: title with an explanation one hover away, the figure, how it compares with
// the period before, and a single-line trend. Empty cards say so rather than drawing zeros.
export function MetricCard({ title, titleNote, info, value, trend = null, comparison, series, empty = false }: Props) {
  return (
    <div className="flex flex-col rounded-lg bg-card p-4 shadow-edge">
      <p className="text-sm font-medium text-foreground">
        {title}{titleNote}
        {info && <InfoTip label={`About ${title}`}>{info}</InfoTip>}
      </p>
      <p className="mt-1 text-xl text-foreground">{value}</p>
      <p className="mt-0.5 h-4 text-xs text-muted-foreground">
        {trend !== null && (
          <>
            <span className={cn('font-medium', trend >= 0 ? 'text-success' : 'text-destructive')}>{trend >= 0 ? '+' : ''}{trend}%</span>
            {comparison && ` ${comparison}`}
          </>
        )}
      </p>
      <div className="mt-3">
        {empty || !series ? <NoData className="min-h-12 py-2" /> : <Sparkline data={series} />}
      </div>
    </div>
  );
}
