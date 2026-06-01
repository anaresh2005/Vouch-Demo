import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface MetricCardWithChartProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: ReactNode;
  chartData?: TimeSeriesDataPoint[];
  chartType: 'line' | 'bar';
  className?: string;
  valueClassName?: string;
  formatValue?: (value: number) => string;
}

export function MetricCardWithChart({
  icon,
  label,
  value,
  change,
  chartData,
  chartType,
  className,
  valueClassName,
  formatValue = (v) => v.toLocaleString(),
}: MetricCardWithChartProps) {
  const hasChartData = chartData && chartData.length > 0;

  return (
    <div className={cn("rounded-md px-3 py-2 flex flex-col relative", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      
      {change ? (
        <div className="flex items-end justify-between">
          <p className={cn("text-lg leading-tight", valueClassName)}>{value}</p>
          {change}
        </div>
      ) : (
        <p className={cn("text-lg leading-tight", valueClassName)}>{value}</p>
      )}

      {hasChartData && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="h-[80px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="equidistantPreserveStart"
                    minTickGap={20}
                  />
                  <YAxis hide />
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
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval="equidistantPreserveStart"
                    minTickGap={20}
                  />
                  <YAxis hide />
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
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
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
