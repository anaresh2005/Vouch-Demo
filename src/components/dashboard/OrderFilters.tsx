import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { VouchOrderStatus } from '@/types/vouch';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type DateFilterType = 'created' | 'delivered' | 'posted_charged';
export type SortField = 'created_at' | 'delivered_at' | 'posted_charged_at' | 'items_count' | 'followers' | 'engagement_rate';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type PlatformFilter = 'instagram' | 'tiktok';
export type StatusFilter = VouchOrderStatus;

export interface OrderFiltersState {
  search: string;
  statuses: StatusFilter[];
  dateType: DateFilterType | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  vouchVerified: 'all' | 'verified' | 'unverified';
  topPerformer: 'all' | 'top' | 'other';
  platforms: PlatformFilter[];
  itemsMin: string;
  itemsMax: string;
  followersMin: string;
  followersMax: string;
  engagementMin: string;
  engagementMax: string;
  sorts: SortConfig[];
}

export const defaultFilters: OrderFiltersState = {
  search: '',
  statuses: [],
  dateType: null,
  dateFrom: null,
  dateTo: null,
  vouchVerified: 'all',
  topPerformer: 'all',
  platforms: [],
  itemsMin: '',
  itemsMax: '',
  followersMin: '',
  followersMax: '',
  engagementMin: '',
  engagementMax: '',
  sorts: [],
};

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  activeFilterCount: number;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'pending_delivery', label: 'In Transit' },
  { value: 'delivered', label: 'Posting' },
  { value: 'post_verified', label: 'Posted' },
  { value: 'charged', label: 'Charged' },
];

const statusLabels: Record<StatusFilter, string> = {
  pending_delivery: 'In Transit',
  delivered: 'Posting',
  post_pending: 'Post Pending',
  post_verified: 'Posted',
  charged: 'Charged',
  completed: 'Completed',
};

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
    onFiltersChange({ ...defaultFilters, search: filters.search });
  };


  const formatDateRange = () => {
    if (!filters.dateFrom && !filters.dateTo) return null;
    const from = filters.dateFrom ? format(filters.dateFrom, 'MMM d') : 'Any';
    const to = filters.dateTo ? format(filters.dateTo, 'MMM d') : 'Any';
    return `${from} - ${to}`;
  };

  const parseFollowers = (value: string): number | null => {
    if (!value) return null;
    const lower = value.toLowerCase().trim();
    const num = parseFloat(lower.replace(/[km]/gi, ''));
    if (isNaN(num)) return null;
    if (lower.includes('m')) return num * 1000000;
    if (lower.includes('k')) return num * 1000;
    return num;
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

        {/* Expanded Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="pt-3">
            <div className="space-y-3">
              {/* Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Date Type</Label>
                  <Select 
                    value={filters.dateType || 'none'} 
                    onValueChange={(value) => updateFilter('dateType', value === 'none' ? null : value as DateFilterType)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select date type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">No date filter</SelectItem>
                      <SelectItem value="created" className="text-xs">Order Created</SelectItem>
                      <SelectItem value="delivered" className="text-xs">Delivery Date</SelectItem>
                      <SelectItem value="posted_charged" className="text-xs">Posted / Charged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
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
                </div>
              </div>

              {/* Numeric Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Items (Min - Max)</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" placeholder="Min" value={filters.itemsMin} onChange={(e) => updateFilter('itemsMin', e.target.value)} className="w-full h-7 text-xs" min={0} />
                    <Input type="number" placeholder="Max" value={filters.itemsMax} onChange={(e) => updateFilter('itemsMax', e.target.value)} className="w-full h-7 text-xs" min={0} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Followers</Label>
                  <div className="flex gap-1.5">
                    <Input placeholder="Min" value={filters.followersMin} onChange={(e) => updateFilter('followersMin', e.target.value)} className="w-full h-7 text-xs" />
                    <Input placeholder="Max" value={filters.followersMax} onChange={(e) => updateFilter('followersMax', e.target.value)} className="w-full h-7 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Engagement Rate</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" placeholder="Min" value={filters.engagementMin} onChange={(e) => updateFilter('engagementMin', e.target.value)} className="w-full h-7 text-xs" min={0} step={0.1} />
                    <Input type="number" placeholder="Max" value={filters.engagementMax} onChange={(e) => updateFilter('engagementMax', e.target.value)} className="w-full h-7 text-xs" min={0} step={0.1} />
                  </div>
                </div>
              </div>

              {/* Status, Platform, Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Status</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between font-normal h-7 text-xs">
                        <span className="truncate">
                          {filters.statuses.length === 0 ? 'All Statuses' : filters.statuses.length === 1 ? statusLabels[filters.statuses[0]] : `${filters.statuses.length} selected`}
                        </span>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-1.5" align="start">
                      <div className="space-y-0.5">
                        {statusOptions.map((option) => (
                          <div key={option.value} className={cn("flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-xs", filters.statuses.includes(option.value) && "bg-accent")} onClick={() => { const n = filters.statuses.includes(option.value) ? filters.statuses.filter((s) => s !== option.value) : [...filters.statuses, option.value]; updateFilter('statuses', n); }}>
                            <Checkbox checked={filters.statuses.includes(option.value)} className="pointer-events-none h-3.5 w-3.5" />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Platform</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between font-normal h-7 text-xs">
                        <span className="truncate">
                          {filters.platforms.length === 0 ? 'All Platforms' : filters.platforms.length === 1 ? platformLabels[filters.platforms[0]] : `${filters.platforms.length} selected`}
                        </span>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-1.5" align="start">
                      <div className="space-y-0.5">
                        {platformOptions.map((option) => (
                          <div key={option.value} className={cn("flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-xs", filters.platforms.includes(option.value) && "bg-accent")} onClick={() => { const n = filters.platforms.includes(option.value) ? filters.platforms.filter((p) => p !== option.value) : [...filters.platforms, option.value]; updateFilter('platforms', n); }}>
                            <Checkbox checked={filters.platforms.includes(option.value)} className="pointer-events-none h-3.5 w-3.5" />
                            <span>{option.label}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Badges</Label>
                  <div className="flex gap-1.5">
                    <div className={cn("flex-1 flex items-center justify-start gap-1.5 px-2 h-7 rounded-md border border-input bg-transparent cursor-pointer transition-colors text-xs", filters.vouchVerified === 'verified' && "bg-primary/10 border-primary")} onClick={() => updateFilter('vouchVerified', filters.vouchVerified === 'verified' ? 'all' : 'verified')}>
                      <Checkbox id="vouchVerified" checked={filters.vouchVerified === 'verified'} onCheckedChange={(checked) => updateFilter('vouchVerified', checked ? 'verified' : 'all')} className="pointer-events-none h-3.5 w-3.5" />
                      <Label htmlFor="vouchVerified" className="text-xs cursor-pointer whitespace-nowrap">Verified</Label>
                    </div>
                    <div className={cn("flex-1 flex items-center justify-start gap-1.5 px-2 h-7 rounded-md border border-input bg-transparent cursor-pointer transition-colors text-xs", filters.topPerformer === 'top' && "bg-primary/10 border-primary")} onClick={() => updateFilter('topPerformer', filters.topPerformer === 'top' ? 'all' : 'top')}>
                      <Checkbox id="topPerformer" checked={filters.topPerformer === 'top'} onCheckedChange={(checked) => updateFilter('topPerformer', checked ? 'top' : 'all')} className="pointer-events-none h-3.5 w-3.5" />
                      <Label htmlFor="topPerformer" className="text-xs cursor-pointer whitespace-nowrap">Top 10%</Label>
                    </div>
                  </div>
                </div>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Helper to count active filters (excluding search and status which are always visible)
export function countActiveFilters(filters: OrderFiltersState): number {
  let count = 0;
  if (filters.statuses.length > 0) count++;
  if (filters.platforms.length > 0) count++;
  if (filters.dateType) count++;
  if (filters.vouchVerified !== 'all') count++;
  if (filters.topPerformer !== 'all') count++;
  if (filters.itemsMin || filters.itemsMax) count++;
  if (filters.followersMin || filters.followersMax) count++;
  if (filters.engagementMin || filters.engagementMax) count++;
  if (filters.sorts.length > 0) count++;
  return count;
}

// Parse followers input (supports K and M suffixes)
export function parseFollowersInput(value: string): number | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  const num = parseFloat(lower.replace(/[km]/gi, ''));
  if (isNaN(num)) return null;
  if (lower.includes('m')) return num * 1000000;
  if (lower.includes('k')) return num * 1000;
  return num;
}
