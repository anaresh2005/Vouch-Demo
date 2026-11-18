import { useState, useCallback } from 'react';

export type PriorityMetric = 'cpm' | 'emv';

const STORAGE_KEY = 'vouch_priority_metric';
const DEFAULT_METRIC: PriorityMetric = 'cpm';

function loadFromStorage(): PriorityMetric {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'cpm' || raw === 'emv') return raw;
    return DEFAULT_METRIC;
  } catch {
    return DEFAULT_METRIC;
  }
}

export function usePriorityMetric() {
  const [priorityMetric, setPriorityMetricState] = useState<PriorityMetric>(loadFromStorage);

  const savePriorityMetric = useCallback((metric: PriorityMetric) => {
    localStorage.setItem(STORAGE_KEY, metric);
    setPriorityMetricState(metric);
  }, []);

  return { priorityMetric, savePriorityMetric };
}
