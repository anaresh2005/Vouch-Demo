import { createContext, useContext, useState, ReactNode } from 'react';

export type Timeframe = '7d' | '30d' | '90d' | '365d' | 'lifetime' | 'custom';

interface CustomDateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface TimeframeContextType {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: (range: CustomDateRange) => void;
}

const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined);

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    from: undefined,
    to: undefined,
  });

  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe, customDateRange, setCustomDateRange }}>
      {children}
    </TimeframeContext.Provider>
  );
}

export function useTimeframe() {
  const context = useContext(TimeframeContext);
  if (context === undefined) {
    throw new Error('useTimeframe must be used within a TimeframeProvider');
  }
  return context;
}
