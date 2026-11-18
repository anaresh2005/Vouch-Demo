import type { OrderStage } from '@dashboard/lib/orderStage';

export type DateFilterType = 'created' | 'delivered' | 'posted_charged';

export type SortField = 'created_at' | 'delivered_at' | 'posted_charged_at' | 'followers' | 'engagement_rate';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type PlatformFilter = 'instagram' | 'tiktok';

// Status filters use the gift stages shown on the badges and segments (see orderStage).
export type StatusFilter = OrderStage;

export interface OrderFiltersState {
  search: string;
  statuses: StatusFilter[];
  dateType: DateFilterType | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  platforms: PlatformFilter[];
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
  platforms: [],
  followersMin: '',
  followersMax: '',
  engagementMin: '',
  engagementMax: '',
  sorts: [],
};

// Counts the filters that hide gifts. A column sort is not a filter, and a date type only filters
// once a date is picked.
export function countActiveFilters(filters: OrderFiltersState): number {
  let count = 0;
  if (filters.statuses.length > 0) count++;
  if (filters.platforms.length > 0) count++;
  if (filters.dateType && (filters.dateFrom || filters.dateTo)) count++;
  if (filters.followersMin || filters.followersMax) count++;
  if (filters.engagementMin || filters.engagementMax) count++;
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
