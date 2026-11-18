
export type PlatformFilter = 'instagram' | 'tiktok';

export type PostSortField = 'detected_at' | 'views' | 'likes' | 'engagement_rate' | 'cpm' | 'emv';

export type SortDirection = 'asc' | 'desc';

export interface PostSortConfig {
  field: PostSortField;
  direction: SortDirection;
}

export interface PostFiltersState {
  search: string;
  platforms: PlatformFilter[];
  dateFrom: Date | null;
  dateTo: Date | null;
  viewsMin: string;
  viewsMax: string;
  likesMin: string;
  likesMax: string;
  engagementMin: string;
  engagementMax: string;
  cpmMin: string;
  cpmMax: string;
  emvMin: string;
  emvMax: string;
  sort: PostSortConfig | null;
}

export const defaultPostFilters: PostFiltersState = {
  search: '',
  platforms: [],
  dateFrom: null,
  dateTo: null,
  viewsMin: '',
  viewsMax: '',
  likesMin: '',
  likesMax: '',
  engagementMin: '',
  engagementMax: '',
  cpmMin: '',
  cpmMax: '',
  emvMin: '',
  emvMax: '',
  sort: null,
};

// Counts the filters that hide posts; the sort is not a filter.
export function countActivePostFilters(filters: PostFiltersState): number {
  let count = 0;

  if (filters.platforms.length > 0) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  if (filters.viewsMin || filters.viewsMax) count++;
  if (filters.likesMin || filters.likesMax) count++;
  if (filters.engagementMin || filters.engagementMax) count++;
  if (filters.cpmMin || filters.cpmMax) count++;
  if (filters.emvMin || filters.emvMax) count++;

  return count;
}

export function parseNumericInput(value: string): number | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  const num = parseFloat(lower.replace(/[km]/gi, ''));
  if (isNaN(num)) return null;
  if (lower.includes('m')) return num * 1000000;
  if (lower.includes('k')) return num * 1000;
  return num;
}
