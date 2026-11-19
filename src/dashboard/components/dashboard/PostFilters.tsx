import { PlatformFilter, PostSortField, PostFiltersState, defaultPostFilters } from '@dashboard/lib/postFilters';
import { useState } from 'react';
import { Input } from '@dashboard/components/ui/input';
import { Button } from '@dashboard/components/ui/button';
import { Badge } from '@dashboard/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@dashboard/components/ui/popover';
import { FILTER_PANEL_CLASS } from '@dashboard/lib/filterPanel';
import { Calendar } from '@dashboard/components/ui/calendar';
import {
Search,
Filter,
X,
ChevronDown,
Calendar as CalendarIcon,
ArrowUpDown
} from 'lucide-react';
import { cn } from '@dashboard/lib/utils';
import { SortOptionList, type SortOption, CheckboxOptionList, FilterField, RangeFilter } from './FilterControls';
import { format } from 'date-fns';

interface PostFiltersProps {
  filters: PostFiltersState;
  onFiltersChange: (filters: PostFiltersState) => void;
  activeFilterCount: number;
}

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const platformLabels: Record<PlatformFilter, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

const sortOptions: SortOption<PostSortField>[] = [
  { value: 'detected_at', label: 'Date Detected', isDate: true },
  { value: 'views', label: 'Views' },
  { value: 'likes', label: 'Likes' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'cpm', label: 'CPM' },
  { value: 'emv', label: 'EMV' },
];

export function PostFilters({ filters, onFiltersChange, activeFilterCount }: PostFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof PostFiltersState>(
    key: K,
    value: PostFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    // Clearing filters keeps the search and the sort, which are not filters.
    onFiltersChange({ ...defaultPostFilters, search: filters.search, sort: filters.sort });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
        {/* Search and Toggle Row */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              aria-label="Search posts"
              placeholder="Search by name, handle, or post URL..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="h-8 bg-secondary pl-9 shadow-none md:text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Sort Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort
                  {filters.sort && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 flex items-center justify-center text-xs">
                      <span aria-hidden="true">{filters.sort.direction === 'asc' ? '↑' : '↓'}</span>
                      <span className="sr-only">{filters.sort.direction === 'asc' ? 'ascending' : 'descending'}</span>
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="end">
                <SortOptionList label="Sort posts by" options={sortOptions} sort={filters.sort} onChange={(sort) => updateFilter('sort', sort)} />
              </PopoverContent>
            </Popover>

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
            <div className="grid grid-cols-1 gap-3 [@container(min-width:24rem)]:grid-cols-2 [@container(min-width:36rem)]:grid-cols-4">
              {/* Column 1: Views + Detection Date */}
              <div className="space-y-3">
                <RangeFilter label="Views" min={filters.viewsMin} max={filters.viewsMax} onMinChange={(v) => updateFilter('viewsMin', v)} onMaxChange={(v) => updateFilter('viewsMax', v)} />
                <FilterField label="Detection Date">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field} variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal h-7 text-xs", !filters.dateFrom && !filters.dateTo && "text-muted-foreground")}>
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {filters.dateFrom && filters.dateTo
                            ? `${format(filters.dateFrom, 'MMM d')} - ${format(filters.dateTo, 'MMM d, yyyy')}`
                            : filters.dateFrom
                            ? `From ${format(filters.dateFrom, 'MMM d, yyyy')}`
                            : filters.dateTo
                            ? `Until ${format(filters.dateTo, 'MMM d, yyyy')}`
                            : 'Select date range'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="range" selected={{ from: filters.dateFrom || undefined, to: filters.dateTo || undefined }} onSelect={(range) => onFiltersChange({ ...filters, dateFrom: range?.from || null, dateTo: range?.to || null })} initialFocus className="pointer-events-auto" numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>
              </div>

              {/* Column 2: Likes + Platform */}
              <div className="space-y-3">
                <RangeFilter label="Likes" min={filters.likesMin} max={filters.likesMax} onMinChange={(v) => updateFilter('likesMin', v)} onMaxChange={(v) => updateFilter('likesMax', v)} />
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

              {/* Column 3: Engagement % */}
              <div className="space-y-3">
                <RangeFilter label="Engagement Rate" min={filters.engagementMin} max={filters.engagementMax} onMinChange={(v) => updateFilter('engagementMin', v)} onMaxChange={(v) => updateFilter('engagementMax', v)} inputProps={{ type: 'number', min: 0, step: 0.1 }} />
              </div>

              {/* Column 4: CPM + EMV + Sales Impact */}
              <div className="space-y-3">
                <RangeFilter label="CPM ($)" min={filters.cpmMin} max={filters.cpmMax} onMinChange={(v) => updateFilter('cpmMin', v)} onMaxChange={(v) => updateFilter('cpmMax', v)} inputProps={{ type: 'number', min: 0, step: 0.01 }} />
                <RangeFilter label="EMV ($)" min={filters.emvMin} max={filters.emvMax} onMinChange={(v) => updateFilter('emvMin', v)} onMaxChange={(v) => updateFilter('emvMax', v)} inputProps={{ type: 'number', min: 0, step: 1 }} />

              </div>
            </div>

              {/* Clear All Button */}
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
      </div>
  );
}
