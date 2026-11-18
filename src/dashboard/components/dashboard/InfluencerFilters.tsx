import { PlatformFilter, InfluencerSortField, InfluencerFiltersState, defaultInfluencerFilters } from '@dashboard/lib/influencerFilters';
import { useState } from 'react';
import { Input } from '@dashboard/components/ui/input';
import { Button } from '@dashboard/components/ui/button';
import { Badge } from '@dashboard/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@dashboard/components/ui/popover';
import { FILTER_PANEL_CLASS } from '@dashboard/lib/filterPanel';
import { InfluencerCategory } from '@dashboard/types/vouch';
import {
Search,
Filter,
X,
ChevronDown,
ArrowUpDown
} from 'lucide-react';
import { ORDER_STAGES, STAGE_LABELS } from '@dashboard/lib/orderStage';
import { SortOptionList, type SortOption, CheckboxOptionList, FilterField, RangeFilter } from './FilterControls';

interface InfluencerFiltersProps {
  filters: InfluencerFiltersState;
  onFiltersChange: (filters: InfluencerFiltersState) => void;
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

const categoryOptions: { value: InfluencerCategory; label: string }[] = [
  { value: 'Fashion & Beauty', label: 'Fashion & Beauty' },
  { value: 'Tech & Gaming', label: 'Tech & Gaming' },
  { value: 'Health & Fitness', label: 'Health & Fitness' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Travel & Adventure', label: 'Travel & Adventure' },
  { value: 'Food & Cooking', label: 'Food & Cooking' },
  { value: 'Home & Decor', label: 'Home & Decor' },
  { value: 'Parenting & Family', label: 'Parenting & Family' },
];

// Status options are the gift stages shown on the "Latest gift" badges, in the same words.
const statusOptions = ORDER_STAGES.map(stage => ({ value: stage, label: STAGE_LABELS[stage] }));
const statusLabels = STAGE_LABELS;

const sortOptions: SortOption<InfluencerSortField>[] = [
  { value: 'followers', label: 'Followers' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'orders_count', label: 'Orders Count' },
  { value: 'avg_cpm', label: 'Avg CPM' },
  { value: 'avg_emv', label: 'Avg EMV' },
];

export function InfluencerFilters({ filters, onFiltersChange, activeFilterCount }: InfluencerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof InfluencerFiltersState>(
    key: K,
    value: InfluencerFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    // Clearing filters keeps the search and the sort, which are not filters.
    onFiltersChange({ ...defaultInfluencerFilters, search: filters.search, sort: filters.sort });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
        {/* Search and Toggle Row */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              aria-label="Search creators"
              placeholder="Search by name, handle, email, or order ID..."
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
                <SortOptionList label="Sort creators by" options={sortOptions} sort={filters.sort} onChange={(sort) => updateFilter('sort', sort)} />
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
              {/* Numeric Filters - Followers, Engagement, CPM, EMV, Sales */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                <RangeFilter label="Followers" min={filters.followersMin} max={filters.followersMax} onMinChange={(v) => updateFilter('followersMin', v)} onMaxChange={(v) => updateFilter('followersMax', v)} />

                <RangeFilter label="Engagement Rate" min={filters.engagementMin} max={filters.engagementMax} onMinChange={(v) => updateFilter('engagementMin', v)} onMaxChange={(v) => updateFilter('engagementMax', v)} inputProps={{ type: 'number', min: 0, step: 0.1 }} />

                {/* Category - multi-select dropdown */}
                <FilterField label="Category">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field}
                          variant="outline"
                          size="sm"
                          className="w-full justify-between font-normal h-7 text-xs"
                        >
                          <span className="truncate">
                            {filters.categories.length === 0
                              ? 'All Categories'
                              : filters.categories.length === 1
                              ? filters.categories[0]
                              : `${filters.categories.length} selected`}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-1.5" align="start">
                        <CheckboxOptionList options={categoryOptions} selected={filters.categories} onChange={(next) => updateFilter('categories', next)} />
                      </PopoverContent>
                    </Popover>
                  )}
                </FilterField>
              </div>

              {/* Numeric Filters - CPM, EMV, Sales */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                <RangeFilter label="Avg CPM ($)" min={filters.cpmMin} max={filters.cpmMax} onMinChange={(v) => updateFilter('cpmMin', v)} onMaxChange={(v) => updateFilter('cpmMax', v)} inputProps={{ type: 'number', min: 0, step: 0.01 }} />
                <RangeFilter label="Avg EMV ($)" min={filters.emvMin} max={filters.emvMax} onMinChange={(v) => updateFilter('emvMin', v)} onMaxChange={(v) => updateFilter('emvMax', v)} inputProps={{ type: 'number', min: 0, step: 1 }} />

              </div>

              {/* Dropdowns - Status, Platform */}
              <div className="grid grid-cols-1 gap-3 [@container(min-width:28rem)]:grid-cols-3">
                {/* Status - multi-select dropdown */}
                <FilterField label="Status">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field}
                          variant="outline"
                          size="sm"
                          className="w-full justify-between font-normal h-7 text-xs"
                        >
                          <span className="truncate">
                            {filters.statuses.length === 0
                              ? 'All Statuses'
                              : filters.statuses.length === 1
                              ? statusLabels[filters.statuses[0]]
                              : `${filters.statuses.length} selected`}
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

                {/* Platform - multi-select dropdown */}
                <FilterField label="Platform">
                  {(field) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button {...field}
                          variant="outline"
                          size="sm"
                          className="w-full justify-between font-normal h-7 text-xs"
                        >
                          <span className="truncate">
                            {filters.platforms.length === 0
                              ? 'All Platforms'
                              : filters.platforms.length === 1
                              ? platformLabels[filters.platforms[0]]
                              : `${filters.platforms.length} selected`}
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

              {/* Clear All Button */}
              {activeFilterCount > 0 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground h-6 text-xs"
                  >
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
