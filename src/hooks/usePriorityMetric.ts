import { useState, useCallback } from 'react';

export type PriorityMetric = 'sales' | 'cpm' | 'emv';

const STORAGE_KEY = 'vouch_priority_metric';
const DEFAULT_METRIC: PriorityMetric = 'sales';

function loadFromStorage(): PriorityMetric {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'sales' || raw === 'cpm' || raw === 'emv') return raw;
    return DEFAULT_METRIC;
  } catch {
    return DEFAULT_METRIC;
  }
}

export function usePriorityMetric() {
  const [priorityMetric, setPriorityMetricState] = useState<PriorityMetric>(loadFromStorage);

  const savePriorityMetric = useCallback((metric: PriorityMetric) => {
    setPriorityMetricState(metric);
    try {
      localStorage.setItem(STORAGE_KEY, metric);
    } catch {
      // localStorage unavailable — works in-memory
    }
  }, []);

  /**
   * Returns Tailwind class fragments for a given metric type.
   * Priority metric → primary (purple), others → muted/gray.
   */
  const getMetricColor = useCallback(
    (metric: 'sales' | 'cpm' | 'emv') => {
      const isPriority = priorityMetric === metric;
      return {
        text: isPriority ? 'text-primary' : 'text-foreground',
        border: isPriority ? 'border-primary/50' : 'border-border/50',
        bg: isPriority ? 'bg-primary/10' : 'bg-card',
        gradient: isPriority
          ? 'bg-gradient-to-br from-primary/10 via-primary/5 via-60% to-card'
          : 'bg-card',
        badgeBg: isPriority ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground',
        icon: isPriority ? 'text-primary' : 'text-muted-foreground',
      };
    },
    [priorityMetric]
  );

  return { priorityMetric, savePriorityMetric, getMetricColor };
}
