// One search rule for the Creators, Gifts and Posts tables. Normalise the typed query once, then
// match it against each row's fields.

// Ignores surrounding spaces and case, and a leading "@" so a handle can be typed as it is displayed.
export function normalizeSearch(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, '');
}

// Whether any field contains the normalised query. An empty query matches every row.
export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  return !query || fields.some(field => field?.toLowerCase().includes(query));
}

// Shopify shows order numbers with a leading "#"; it is ignored when matching the stored order ID.
export function matchesOrderNumber(query: string, shopifyOrderId: string | null | undefined): boolean {
  const number = query.replace(/^#/, '').trim();
  return !!number && !!shopifyOrderId?.toLowerCase().includes(number);
}
