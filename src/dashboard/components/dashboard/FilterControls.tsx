import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { Checkbox } from '@dashboard/components/ui/checkbox';
import { initialSortDirection } from '@dashboard/lib/sort';
import { cn } from '@dashboard/lib/utils';

// Shared pieces of the Posts, Creators and Gifts filter bars, built so they work by keyboard and
// are announced properly by screen readers.

type SortDirection = 'asc' | 'desc';
export interface SortOption<F extends string> { value: F; label: string; isDate?: boolean }

const labelClass = 'text-xs font-medium text-subdued';

/** "lowest first" / "highest first", or "oldest first" / "newest first" for a date. */
function sortDirectionLabel(direction: SortDirection, isDate = false) {
  if (isDate) return direction === 'asc' ? 'oldest first' : 'newest first';
  return direction === 'asc' ? 'lowest first' : 'highest first';
}

/**
 * The sort choices as buttons. The chosen one is pressed and its name includes its direction
 * (for example "Avg CPM, lowest first"); choosing it again flips the direction.
 */
export function SortOptionList<F extends string>({ label, options, sort, onChange }: {
  label: string;
  options: SortOption<F>[];
  sort: { field: F; direction: SortDirection } | null;
  onChange: (sort: { field: F; direction: SortDirection } | null) => void;
}) {
  const rowClass = 'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';
  return (
    <div role="group" aria-label={label} className="space-y-1">
      <button type="button" aria-pressed={!sort} aria-label="No sorting" className={cn(rowClass, !sort && 'bg-accent')} onClick={() => onChange(null)}>
        None
      </button>
      {options.map((option) => {
        const chosen = sort?.field === option.value ? sort : null;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={!!chosen}
            aria-label={chosen ? `${option.label}, ${sortDirectionLabel(chosen.direction, option.isDate)}` : option.label}
            className={cn(rowClass, chosen && 'bg-accent')}
            onClick={() => onChange(chosen
              ? { field: option.value, direction: chosen.direction === 'asc' ? 'desc' : 'asc' }
              : { field: option.value, direction: initialSortDirection(option.value) })}
          >
            <span>{option.label}</span>
            {chosen && <span aria-hidden="true" className="text-xs text-muted-foreground">{chosen.direction === 'asc' ? '↑' : '↓'}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A multi-select list of labelled checkboxes; Space on a checkbox or a click on its label toggles it. */
export function CheckboxOptionList<V extends string>({ options, selected, onChange }: {
  options: { value: V; label: string }[];
  selected: V[];
  onChange: (selected: V[]) => void;
}) {
  const baseId = useId();
  return (
    <div className="space-y-0.5">
      {options.map((option) => {
        const id = `${baseId}-${option.value}`;
        const checked = selected.includes(option.value);
        return (
          <div key={option.value} className={cn('flex items-center gap-2 rounded-md px-2 text-xs hover:bg-accent', checked && 'bg-accent')}>
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(next) => onChange(next === true ? [...selected, option.value] : selected.filter((v) => v !== option.value))}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor={id} className="flex-1 cursor-pointer py-1 text-xs font-normal leading-4 text-inherit">{option.label}</Label>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A filter label above a control. The control is named by the label and then its own text, so a
 * dropdown reads as, for example, "Platform, All Platforms".
 */
export function FilterField({ label, children }: {
  label: string;
  children: (control: { id: string; 'aria-labelledby': string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <Label id={`${id}-label`} className={labelClass}>{label}</Label>
      {children({ id, 'aria-labelledby': `${id}-label ${id}` })}
    </div>
  );
}

/** A labelled pair of Min/Max boxes, announced as, for example, "Views minimum". */
export function RangeFilter({ label, min, max, onMinChange, onMaxChange, inputProps }: {
  label: string;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  inputProps?: Pick<ComponentProps<'input'>, 'type' | 'min' | 'step'>;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="space-y-1">
      <Label id={id} className={labelClass}>{label}</Label>
      <div className="flex gap-1.5">
        <Input {...inputProps} aria-label={`${label} minimum`} placeholder="Min" value={min} onChange={(e) => onMinChange(e.target.value)} className="w-full h-7 text-xs" />
        <Input {...inputProps} aria-label={`${label} maximum`} placeholder="Max" value={max} onChange={(e) => onMaxChange(e.target.value)} className="w-full h-7 text-xs" />
      </div>
    </div>
  );
}
