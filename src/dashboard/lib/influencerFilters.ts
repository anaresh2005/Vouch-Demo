import type { OrderStage } from '@dashboard/lib/orderStage';
import { InfluencerCategory } from '@dashboard/types/vouch';

export type PlatformFilter = 'instagram' | 'tiktok';

export type InfluencerSortField = 'followers' | 'engagement_rate' | 'orders_count' | 'avg_cpm' | 'avg_emv';

export type SortDirection = 'asc' | 'desc';

export interface InfluencerSortConfig {
  field: InfluencerSortField;
  direction: SortDirection;
}

export interface InfluencerFiltersState {
  search: string;
  platforms: PlatformFilter[];
  categories: InfluencerCategory[];
  statuses: OrderStage[];
  followersMin: string;
  followersMax: string;
  engagementMin: string;
  engagementMax: string;
  cpmMin: string;
  cpmMax: string;
  emvMin: string;
  emvMax: string;
  sort: InfluencerSortConfig | null;
}

export const defaultInfluencerFilters: InfluencerFiltersState = {
  search: '',
  platforms: [],
  categories: [],
  statuses: [],
  followersMin: '',
  followersMax: '',
  engagementMin: '',
  engagementMax: '',
  cpmMin: '',
  cpmMax: '',
  emvMin: '',
  emvMax: '',
  sort: null,
};

// Counts the filters that hide creators; the sort is not a filter.
export function countActiveInfluencerFilters(filters: InfluencerFiltersState): number {
  let count = 0;

  if (filters.platforms.length > 0) count++;
  if (filters.categories.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.followersMin || filters.followersMax) count++;
  if (filters.engagementMin || filters.engagementMax) count++;
  if (filters.cpmMin || filters.cpmMax) count++;
  if (filters.emvMin || filters.emvMax) count++;

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
