import { DateFilterType, PlatformFilter, OrderFiltersState, defaultFilters } from '@dashboard/lib/orderFilters';
import { ORDER_STAGES, STAGE_LABELS } from '@dashboard/lib/orderStage';
import { useState } from 'react';
import { Input } from '@dashboard/components/ui/input';
import { Button } from '@dashboard/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@dashboard/components/ui/popover';
import { FILTER_PANEL_CLASS } from '@dashboard/lib/filterPanel';
import { Calendar } from '@dashboard/components/ui/calendar';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@dashboard/components/ui/select';
import {
Search,
Filter,
X,
ChevronDown,
Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@dashboard/lib/utils';
import { CheckboxOptionList, FilterField, RangeFilter } from './FilterControls';
import { format } from 'date-fns';

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  activeFilterCount: number;
}

// Status options are the gift stages shown on the status badges, in the same words.
const statusOptions = ORDER_STAGES.map(stage => ({ value: stage, label: STAGE_LABELS[stage] }));
const statusLabels = STAGE_LABELS;

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const platformLabels: Record<PlatformFilter, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

export function OrderFilters({ filters, onFiltersChange, activeFilterCount }: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof OrderFiltersState>(
    key: K,
    value: OrderFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    // Clearing filters keeps the search and the column sort, which are not filters.
    onFiltersChange({ ...defaultFilters, search: filters.search, sorts: filters.sorts });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
        {/* Search and Toggle Row */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              aria-label="Search gifts"
              placeholder="Search by name, handle, email, or order ID..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="h-8 bg-secondary pl-9 shadow-none md:text-sm"
            />
          </div>
          
          <Popover open={isExpanded} onOpenChange={setIsExpanded}>
              <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter />
                Filter
                {activeFilterCount > 0 && (
                  <span className="rounded-sm bg-primary/10 px-1 text-xs text-primary">{activeFilterCount}</span>
                )}
              </Button>
            </PopoverTrigger>
              <PopoverContent align="start" collisionPadding={16} className={FILTER_PANEL_CLASS}>
            <div className="space-y-3">
              {/* Date Filters */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                <FilterField label="Date Type">
                  {(field) => (
                    <Select 
                      value={filters.dateType || 'none'} 
                      onValueChange={(value) => updateFilter('dateType', value === 'none' ? null : value as DateFilterType)}
                    >
                      <SelectTrigger {...field} className="h-7 text-xs">
                        <SelectValue placeholder="Select date type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">No date filter</SelectItem>
                        <SelectItem value="created" className="text-xs">Order Created</SelectItem>
                        <SelectItem value="delivered" className="text-xs">Delivery Date</SelectItem>
                        <SelectItem value="posted_charged" className="text-xs">Posted / Charged</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FilterField>

                <FilterField label="From">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left font-normal h-7 text-xs",
                            !filters.dateFrom && "text-muted-foreground"
                          )}
                          disabled={!filters.dateType}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom || undefined}
                          onSelect={(date) => updateFilter('dateFrom', date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>

                <FilterField label="To">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left font-normal h-7 text-xs",
                            !filters.dateTo && "text-muted-foreground"
                          )}
                          disabled={!filters.dateType}
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo || undefined}
                          onSelect={(date) => updateFilter('dateTo', date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>
              </div>

              {/* Numeric Filters */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                <RangeFilter label="Followers" min={filters.followersMin} max={filters.followersMax} onMinChange={(v) => updateFilter('followersMin', v)} onMaxChange={(v) => updateFilter('followersMax', v)} />
                <RangeFilter label="Engagement Rate" min={filters.engagementMin} max={filters.engagementMax} onMinChange={(v) => updateFilter('engagementMin', v)} onMaxChange={(v) => updateFilter('engagementMax', v)} inputProps={{ type: 'number', min: 0, step: 0.1 }} />
              </div>

              {/* Status, Platform */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                <FilterField label="Status">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field} variant="outline" size="sm" className="w-full justify-between font-normal h-7 text-xs">
                          <span className="truncate">
                            {filters.statuses.length === 0 ? 'All Statuses' : filters.statuses.length === 1 ? statusLabels[filters.statuses[0]] : `${filters.statuses.length} selected`}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-1.5" align="start">
                        <CheckboxOptionList options={statusOptions} selected={filters.statuses} onChange={(next) => updateFilter('statuses', next)} />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>

                <FilterField label="Platform">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field} variant="outline" size="sm" className="w-full justify-between font-normal h-7 text-xs">
                          <span className="truncate">
                            {filters.platforms.length === 0 ? 'All Platforms' : filters.platforms.length === 1 ? platformLabels[filters.platforms[0]] : `${filters.platforms.length} selected`}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-1.5" align="start">
                        <CheckboxOptionList options={platformOptions} selected={filters.platforms} onChange={(next) => updateFilter('platforms', next)} />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>

              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground h-6 text-xs">
                    <X className="w-3 h-3 mr-1.5" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
            </Popover>
        </div>
      </div>
  );
}

// Helper to count active filters (excluding search and status which are always visible)

// Parse followers input (supports K and M suffixes)
