// A partial sample must never be labelled as a complete total or average.
export function recordedTotal(values: (number | null | undefined)[]): number | null {
  if (values.some(value => value == null || !Number.isFinite(value))) return null;
  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

export function recordedAverage(values: (number | null | undefined)[]): number | null {
  const total = recordedTotal(values);
  return values.length && total !== null ? total / values.length : null;
}

export function recordedMedian(values: (number | null | undefined)[]): number | null {
  if (!values.length || recordedTotal(values) === null) return null;
  const sorted = [...(values as number[])].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
