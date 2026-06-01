import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { InfluencerCategory, VouchOrderStatus } from '@/types/vouch';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlatformFilter = 'instagram' | 'tiktok';
export type InfluencerSortField = 'followers' | 'engagement_rate' | 'orders_count' | 'best_cpm' | 'avg_emv' | 'sales';
export type SortDirection = 'asc' | 'desc';

export interface InfluencerSortConfig {
  field: InfluencerSortField;
  direction: SortDirection;
}

export interface InfluencerFiltersState {
  search: string;
  platforms: PlatformFilter[];
  categories: InfluencerCategory[];
  statuses: VouchOrderStatus[];
  vouchVerified: 'all' | 'verified' | 'unverified';
  topPerformer: 'all' | 'top' | 'other';
  followersMin: string;
  followersMax: string;
  engagementMin: string;
  engagementMax: string;
  cpmMin: string;
  cpmMax: string;
  emvMin: string;
  emvMax: string;
  salesMin: string;
  salesMax: string;
  sort: InfluencerSortConfig | null;
}

export const defaultInfluencerFilters: InfluencerFiltersState = {
  search: '',
  platforms: [],
  categories: [],
  statuses: [],
  vouchVerified: 'all',
  topPerformer: 'all',
  followersMin: '',
  followersMax: '',
  engagementMin: '',
  engagementMax: '',
  cpmMin: '',
  cpmMax: '',
  emvMin: '',
  emvMax: '',
  salesMin: '',
  salesMax: '',
  sort: null,
};

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

const statusOptions: { value: VouchOrderStatus; label: string }[] = [
  { value: 'pending_delivery', label: 'In Transit' },
  { value: 'delivered', label: 'Posting' },
  { value: 'post_verified', label: 'Posted' },
  { value: 'charged', label: 'Charged' },
];

const statusLabels: Record<VouchOrderStatus, string> = {
  pending_delivery: 'In Transit',
  delivered: 'Posting',
  post_pending: 'Posting',
  post_verified: 'Posted',
  charged: 'Charged',
  completed: 'Posted',
};

const sortOptions: { value: InfluencerSortField; label: string }[] = [
  { value: 'followers', label: 'Followers' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'orders_count', label: 'Orders Count' },
  { value: 'best_cpm', label: 'Best CPM' },
  { value: 'avg_emv', label: 'Avg EMV' },
  { value: 'sales', label: 'Sales Impact' },
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
    onFiltersChange({ ...defaultInfluencerFilters, search: filters.search });
  };


  return (
    <Card className="glass">
      <CardContent className="p-3">
        {/* Search and Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, handle, email, or order ID..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Sort Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort
                  {filters.sort && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 flex items-center justify-center text-[10px]">
                      {filters.sort.direction === 'asc' ? '↑' : '↓'}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="end">
                <div className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                      !filters.sort && "bg-accent"
                    )}
                    onClick={() => updateFilter('sort', null)}
                  >
                    <span className="text-sm">None</span>
                  </div>
                  {sortOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent",
                        filters.sort?.field === option.value && "bg-accent"
                      )}
                      onClick={() => {
                        if (filters.sort?.field === option.value) {
                          // Toggle direction
                          updateFilter('sort', {
                            field: option.value,
                            direction: filters.sort.direction === 'asc' ? 'desc' : 'asc'
                          });
                        } else {
                          updateFilter('sort', { field: option.value, direction: 'desc' });
                        }
                      }}
                    >
                      <span className="text-sm">{option.label}</span>
                      {filters.sort?.field === option.value && (
                        <span className="text-xs text-muted-foreground">
                          {filters.sort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Expanded Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="pt-3">
            <div className="space-y-3">
              {/* Numeric Filters - Followers, Engagement, CPM, EMV, Sales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Followers</Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Min"
                      value={filters.followersMin}
                      onChange={(e) => updateFilter('followersMin', e.target.value)}
                      className="w-full h-7 text-xs"
                    />
                    <Input
                      placeholder="Max"
                      value={filters.followersMax}
                      onChange={(e) => updateFilter('followersMax', e.target.value)}
                      className="w-full h-7 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Engagement Rate</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.engagementMin}
                      onChange={(e) => updateFilter('engagementMin', e.target.value)}
                      className="w-full h-7 text-xs"
                      min={0}
                      step={0.1}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.engagementMax}
                      onChange={(e) => updateFilter('engagementMax', e.target.value)}
                      className="w-full h-7 text-xs"
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>

                {/* Category - multi-select dropdown */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Category</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                      <div className="space-y-0.5">
                        {categoryOptions.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-xs",
                              filters.categories.includes(option.value) && "bg-accent"
                            )}
                            onClick={() => {
                              const newCategories = filters.categories.includes(option.value)
                                ? filters.categories.filter((c) => c !== option.value)
                                : [...filters.categories, option.value];
                              updateFilter('categories', newCategories);
                            }}
                          >
                            <Checkbox
                              checked={filters.categories.includes(option.value)}
                              className="pointer-events-none h-3.5 w-3.5"
                            />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Numeric Filters - CPM, EMV, Sales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Best CPM ($)</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" placeholder="Min" value={filters.cpmMin} onChange={(e) => updateFilter('cpmMin', e.target.value)} className="w-full h-7 text-xs" min={0} step={0.01} />
                    <Input type="number" placeholder="Max" value={filters.cpmMax} onChange={(e) => updateFilter('cpmMax', e.target.value)} className="w-full h-7 text-xs" min={0} step={0.01} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Avg EMV ($)</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" placeholder="Min" value={filters.emvMin} onChange={(e) => updateFilter('emvMin', e.target.value)} className="w-full h-7 text-xs" min={0} step={1} />
                    <Input type="number" placeholder="Max" value={filters.emvMax} onChange={(e) => updateFilter('emvMax', e.target.value)} className="w-full h-7 text-xs" min={0} step={1} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Sales Impact ($)</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" placeholder="Min" value={filters.salesMin} onChange={(e) => updateFilter('salesMin', e.target.value)} className="w-full h-7 text-xs" min={0} step={1} />
                    <Input type="number" placeholder="Max" value={filters.salesMax} onChange={(e) => updateFilter('salesMax', e.target.value)} className="w-full h-7 text-xs" min={0} step={1} />
                  </div>
                </div>
              </div>

              {/* Dropdowns - Status, Platform, Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Status - multi-select dropdown */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Status</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                      <div className="space-y-0.5">
                        {statusOptions.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-xs",
                              filters.statuses.includes(option.value) && "bg-accent"
                            )}
                            onClick={() => {
                              const newStatuses = filters.statuses.includes(option.value)
                                ? filters.statuses.filter((s) => s !== option.value)
                                : [...filters.statuses, option.value];
                              updateFilter('statuses', newStatuses);
                            }}
                          >
                            <Checkbox
                              checked={filters.statuses.includes(option.value)}
                              className="pointer-events-none h-3.5 w-3.5"
                            />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Platform - multi-select dropdown */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Platform</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                      <div className="space-y-0.5">
                        {platformOptions.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-xs",
                              filters.platforms.includes(option.value) && "bg-accent"
                            )}
                            onClick={() => {
                              const newPlatforms = filters.platforms.includes(option.value)
                                ? filters.platforms.filter((p) => p !== option.value)
                                : [...filters.platforms, option.value];
                              updateFilter('platforms', newPlatforms);
                            }}
                          >
                            <Checkbox
                              checked={filters.platforms.includes(option.value)}
                              className="pointer-events-none h-3.5 w-3.5"
                            />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Badges filter */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Badges</Label>
                  <div className="flex gap-1.5">
                    <div 
                      className={cn(
                        "flex-1 flex items-center justify-start gap-1.5 px-2 h-7 rounded-md border border-input bg-transparent cursor-pointer transition-colors text-xs",
                        filters.vouchVerified === 'verified' && "bg-primary/10 border-primary"
                      )}
                      onClick={() => updateFilter('vouchVerified', filters.vouchVerified === 'verified' ? 'all' : 'verified')}
                    >
                      <Checkbox
                        id="vouchVerified"
                        checked={filters.vouchVerified === 'verified'}
                        className="pointer-events-none h-3.5 w-3.5"
                      />
                      <label htmlFor="vouchVerified" className="text-xs cursor-pointer">
                        Verified
                      </label>
                    </div>
                    <div 
                      className={cn(
                        "flex-1 flex items-center justify-start gap-1.5 px-2 h-7 rounded-md border border-input bg-transparent cursor-pointer transition-colors text-xs",
                        filters.topPerformer === 'top' && "bg-primary/10 border-primary"
                      )}
                      onClick={() => updateFilter('topPerformer', filters.topPerformer === 'top' ? 'all' : 'top')}
                    >
                      <Checkbox
                        id="topPerformer"
                        checked={filters.topPerformer === 'top'}
                        className="pointer-events-none h-3.5 w-3.5"
                      />
                      <label htmlFor="topPerformer" className="text-xs cursor-pointer">
                        Top 10%
                      </label>
                    </div>
                  </div>
                </div>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function countActiveInfluencerFilters(filters: InfluencerFiltersState): number {
  let count = 0;
  
  if (filters.platforms.length > 0) count++;
  if (filters.categories.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.vouchVerified !== 'all') count++;
  if (filters.topPerformer !== 'all') count++;
  if (filters.followersMin || filters.followersMax) count++;
  if (filters.engagementMin || filters.engagementMax) count++;
  if (filters.cpmMin || filters.cpmMax) count++;
  if (filters.emvMin || filters.emvMax) count++;
  if (filters.salesMin || filters.salesMax) count++;
  
  return count;
}

export function parseFollowersInput(value: string): number | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  const num = parseFloat(lower.replace(/[km]/gi, ''));
  if (isNaN(num)) return null;
  if (lower.includes('m')) return num * 1000000;
  if (lower.includes('k')) return num * 1000;
  return num;
}
