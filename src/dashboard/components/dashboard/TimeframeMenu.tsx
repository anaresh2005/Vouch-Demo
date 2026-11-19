import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@dashboard/components/ui/dropdown-menu';
import type { Timeframe } from '@dashboard/hooks/useTimeframe';
import { TIMEFRAME_LABELS } from '@dashboard/lib/timeframes';
import { cn } from '@dashboard/lib/utils';


// A Stripe-style filter chip: the filter's name, then its current value in periwinkle.
// The options are one click away; the page shows only what's chosen.
export function FilterChip({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full bg-card pl-2.5 pr-2 text-sm shadow-edge', className)}>
      <span className="font-medium text-foreground">{label}</span>
      <span className="h-3.5 w-px bg-border" />
      <span className="font-medium text-primary">{value}</span>
      <ChevronDown className="h-3.5 w-3.5 text-primary" />
    </span>
  );
}

export function TimeframeMenu({ value, onChange, customLabel, allowCustom = false }: {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
  /** Shown when a custom range is chosen (Analytics' date picker). */
  customLabel?: string;
  /** Offer "Custom range" as an option (Analytics only). */
  allowCustom?: boolean;
}) {
  const current = value === 'custom' ? customLabel ?? 'Custom' : TIMEFRAME_LABELS[value];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25" aria-label={`Date range: ${current}`}>
        <FilterChip label="Date range" value={current} className="hover:bg-secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(Object.keys(TIMEFRAME_LABELS) as (keyof typeof TIMEFRAME_LABELS)[]).map(option => (
          <DropdownMenuItem key={option} onSelect={() => onChange(option)} className={cn(option === value && 'font-medium text-primary')}>
            {TIMEFRAME_LABELS[option]}
          </DropdownMenuItem>
        ))}
        {allowCustom && (
          <DropdownMenuItem onSelect={() => onChange('custom')} className={cn(value === 'custom' && 'font-medium text-primary')}>Custom range</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
