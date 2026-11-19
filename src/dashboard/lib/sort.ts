type SortDirection = 'asc' | 'desc';

/**
 * Compare two sort values where null means "no value yet" (for example a CPM that can't be
 * calculated). Missing values always sort last, whichever the direction, so they never lead a list.
 */
export function compareMissingLast(a: number | null, b: number | null, direction: SortDirection): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return direction === 'asc' ? a - b : b - a;
}

/** The direction a sort starts in when first chosen: lowest first for CPM (lower is better), otherwise highest first. */
export function initialSortDirection(field: string): SortDirection {
  return field === 'cpm' || field === 'avg_cpm' ? 'asc' : 'desc';
}
