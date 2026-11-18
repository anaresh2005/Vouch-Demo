import type { Timeframe, CustomDateRange } from '@dashboard/hooks/useTimeframe';
import { useState, ReactNode } from 'react';
import { TimeframeContext } from '@dashboard/hooks/useTimeframe';

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
