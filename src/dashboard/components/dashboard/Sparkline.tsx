import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// A single periwinkle line with no fill or gridlines, as in Stripe's overview cards.
export function Sparkline({ data, className = '' }: { data: number[]; className?: string }) {
  const chartData = useMemo(() => data.map((value, index) => ({ value, index })), [data]);
  return (
    <div className={`h-12 w-full ${className}`} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={[0, 'dataMax']} />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
