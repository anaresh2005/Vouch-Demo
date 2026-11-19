import { cn } from '@dashboard/lib/utils';

type Segment = { label: string; count: number; value: string };

// Stripe's quick-filter segments above a table: each is a bordered pill with a count, and the
// selected one gets a dark outline.
export function StatusSegments({ segments, value, onChange }: { segments: Segment[]; value: string; onChange: (value: string) => void }) {
  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
      {segments.map(segment => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(segment.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg bg-card px-3 text-sm font-medium transition-[box-shadow,background-color] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
              selected ? 'text-foreground shadow-[0_0_0_2px_hsl(var(--foreground))]' : 'text-subdued shadow-edge hover:bg-secondary',
            )}
          >
            {segment.label}
            <span className={cn('font-normal', selected ? 'text-muted-foreground' : 'text-faint')}>{segment.count}</span>
          </button>
        );
      })}
    </div>
  );
}
