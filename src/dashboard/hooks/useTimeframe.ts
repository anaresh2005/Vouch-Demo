import { createContext, useContext } from 'react';

export type Timeframe = '7d' | '30d' | '90d' | '365d' | 'lifetime' | 'custom';

export interface CustomDateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface TimeframeContextType {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: (range: CustomDateRange) => void;
}

export const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined);

export function useTimeframe() {
  const context = useContext(TimeframeContext);
  if (context === undefined) {
    throw new Error('useTimeframe must be used within a TimeframeProvider');
  }
  return context;
}
