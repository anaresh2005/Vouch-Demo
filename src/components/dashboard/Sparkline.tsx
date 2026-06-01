import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

let sparklineIdCounter = 0;

export function Sparkline({ data, trend = 'neutral', className = '' }: SparklineProps) {
  const chartData = useMemo(() => data.map((value, index) => ({ value, index })), [data]);
  
  const getColor = () => {
    switch (trend) {
      case 'positive': return '#10b981'; // emerald-500 (matches "posted" status)
      case 'negative': return '#f43f5e'; // rose-500 (matches "charged" status)
      default: return 'hsl(var(--muted-foreground))';
    }
  };
  
  const color = getColor();
  const gradientId = useMemo(() => `sparkline-gradient-${++sparklineIdCounter}`, []);
  
  return (
    <div className={`w-16 h-8 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
