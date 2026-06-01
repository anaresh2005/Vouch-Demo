import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label: string;
}

interface DualMetricCardProps {
  icon: ReactNode;
  label: string;
  totalValue: string | number;
  avgValue?: string | number;
  totalChange?: ReactNode;
  totalChartData?: TimeSeriesDataPoint[];
  className?: string;
  totalValueClassName?: string;
  avgValueClassName?: string;
  formatValue?: (value: number) => string;
  accentColor?: 'primary' | 'rose' | 'emerald';
  chartType?: 'bar' | 'line';
  hideChart?: boolean;
}

export function DualMetricCard({
  icon,
  label,
  totalValue,
  avgValue,
  totalChange,
  totalChartData,
  className,
  totalValueClassName,
  avgValueClassName,
  formatValue = (v) => v.toLocaleString(),
  accentColor,
  chartType = 'bar',
  hideChart = false,
}: DualMetricCardProps) {
  const hasTotalChart = totalChartData && totalChartData.length > 0;
  const chartData = hasTotalChart 
    ? totalChartData.map((item) => ({
        label: item.label,
        total: item.value,
      }))
    : [];

  const getAccentClasses = () => {
    switch (accentColor) {
      case 'primary':
        return 'border-primary/30 bg-gradient-to-br from-primary/5 via-card via-60% to-card border';
      case 'rose':
        return 'border-rose-500/30 bg-gradient-to-br from-rose-500/5 via-card via-60% to-card border';
      case 'emerald':
        return 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card via-60% to-card border';
      default:
        return 'bg-card border border-border';
    }
  };

  const getGradientId = () => `gradient-${accentColor || 'default'}-${label.replace(/\s/g, '')}`;
  
  const getGradientColors = () => {
    // NOTE: Use SVG/CSS-safe HSL strings here (no comma+slash mixed syntax).
    // Opacity is controlled via stopOpacity, so colors can stay fully opaque.
    switch (accentColor) {
      case 'primary':
        return { start: 'hsl(var(--primary))', end: 'hsl(var(--primary))' };
      case 'rose':
        return { start: 'hsl(346 77% 50%)', end: 'hsl(346 77% 70%)' };
      case 'emerald':
        return { start: 'hsl(160 84% 39%)', end: 'hsl(160 84% 55%)' };
      default:
        return { start: 'hsl(var(--primary))', end: 'hsl(var(--primary))' };
    }
  };

  const gradientColors = getGradientColors();

  return (
    <div className={cn("rounded-md px-3 py-2.5 flex flex-col", getAccentClasses(), className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          {icon}
          <span>{label}</span>
        </div>
        {totalChange}
      </div>
      
      <div className="flex items-baseline gap-4 mt-1">
        <div className="flex items-baseline gap-1.5">
          <p className={cn("text-xl leading-tight", totalValueClassName)}>{totalValue}</p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
        {avgValue !== undefined && (
          <div className="flex items-baseline gap-1.5">
            <p className={cn("text-xl leading-tight", avgValueClassName)}>{avgValue}</p>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg</span>
          </div>
        )}
      </div>

      {hasTotalChart && chartData.length > 0 && !hideChart && (
        <div className="mt-3">
          <div className="h-[130px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradientColors.start} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={gradientColors.end} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="equidistantPreserveStart"
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(val: number) => [formatValue(val), label]}
                    labelFormatter={(label) => label}
                  />
                  <Line 
                    type="monotone"
                    dataKey="total" 
                    stroke={gradientColors.start}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradientColors.start} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={gradientColors.end} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    cursor={{ fill: 'hsl(var(--muted-foreground) / 0.15)' }}
                    formatter={(val: number) => [formatValue(val), label]}
                    labelFormatter={(label) => label}
                  />
                  <Bar 
                    dataKey="total" 
                    fill={`url(#${getGradientId()})`}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
