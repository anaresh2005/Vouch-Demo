import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  average: number;
  count: number;
}

interface BoxWhiskerPlotProps {
  stats: BoxPlotStats | null;
  label: string;
  formatValue?: (value: number) => string;
  accentColor?: 'primary' | 'rose' | 'emerald' | 'amber';
  className?: string;
}

export function calculateBoxPlotStats(values: number[]): BoxPlotStats | null {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const average = values.reduce((sum, v) => sum + v, 0) / n;
  
  const getPercentile = (arr: number[], p: number) => {
    const index = (p / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return arr[lower];
    return arr[lower] * (upper - index) + arr[upper] * (index - lower);
  };
  
  return {
    min,
    q1: getPercentile(sorted, 25),
    median: getPercentile(sorted, 50),
    q3: getPercentile(sorted, 75),
    max,
    average,
    count: n,
  };
}

export function BoxWhiskerPlot({
  stats,
  label,
  formatValue = (v) => v.toFixed(1),
  accentColor = 'primary',
  className,
}: BoxWhiskerPlotProps) {
  if (!stats || stats.count < 2) {
    return (
      <div className={cn("h-16 flex items-center justify-center text-muted-foreground text-xs", className)}>
        Insufficient data
      </div>
    );
  }

  const { min, q1, median, q3, max, average } = stats;
  const range = max - min;
  
  // Avoid division by zero
  if (range === 0) {
    return (
      <div className={cn("h-16 flex items-center justify-center text-muted-foreground text-xs", className)}>
        No variance in data
      </div>
    );
  }

  // Calculate positions as percentages
  const q1Pos = ((q1 - min) / range) * 100;
  const medianPos = ((median - min) / range) * 100;
  const q3Pos = ((q3 - min) / range) * 100;
  const averagePos = Math.max(0, Math.min(100, ((average - min) / range) * 100));
  const boxWidth = q3Pos - q1Pos;

  const getAccentClasses = () => {
    switch (accentColor) {
      case 'primary':
        return {
          box: 'bg-primary/20 border-primary/50',
          median: 'bg-primary',
          average: 'border-primary',
          whisker: 'bg-primary/40',
        };
      case 'rose':
        return {
          box: 'bg-rose-500/20 border-rose-500/50',
          median: 'bg-rose-500',
          average: 'border-rose-500',
          whisker: 'bg-rose-500/40',
        };
      case 'emerald':
        return {
          box: 'bg-emerald-500/20 border-emerald-500/50',
          median: 'bg-emerald-500',
          average: 'border-emerald-500',
          whisker: 'bg-emerald-500/40',
        };
      case 'amber':
        return {
          box: 'bg-amber-500/20 border-amber-500/50',
          median: 'bg-amber-500',
          average: 'border-amber-500',
          whisker: 'bg-amber-500/40',
        };
      default:
        return {
          box: 'bg-primary/20 border-primary/50',
          median: 'bg-primary',
          average: 'border-primary',
          whisker: 'bg-primary/40',
        };
    }
  };

  const colors = getAccentClasses();

  return (
    <div className={cn("space-y-2", className)}>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className={cn("w-3 h-0.5 rounded-full", colors.median)} />
          <span>Median</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rotate-45 border bg-card", colors.average)} />
          <span>Average</span>
        </div>
      </div>

      {/* Box plot visualization */}
      <div className="relative h-10 w-full">
        {/* Whisker line (min to max) */}
        <div 
          className={cn("absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full", colors.whisker)}
          style={{ left: '0%', right: '0%' }}
        />
        
        {/* Min whisker cap */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn("absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full", colors.whisker)}
              style={{ left: '0%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <span className="font-medium">Min:</span> {formatValue(min)}
          </TooltipContent>
        </Tooltip>
        
        {/* Max whisker cap */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn("absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full", colors.whisker)}
              style={{ right: '0%' }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <span className="font-medium">Max:</span> {formatValue(max)}
          </TooltipContent>
        </Tooltip>
        
        {/* Box (Q1 to Q3) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn("absolute top-1/2 -translate-y-1/2 h-6 border rounded", colors.box)}
              style={{ left: `${q1Pos}%`, width: `${boxWidth}%` }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div><span className="font-medium">Q1:</span> {formatValue(q1)}</div>
            <div><span className="font-medium">Q3:</span> {formatValue(q3)}</div>
            <div><span className="font-medium">IQR:</span> {formatValue(q3 - q1)}</div>
          </TooltipContent>
        </Tooltip>
        
        {/* Average marker (diamond shape) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${averagePos}%` }}
            >
              <div className={cn(
                "w-2.5 h-2.5 rotate-45 border-2 bg-card",
                colors.average
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <span className="font-medium">Average:</span> {formatValue(average)}
          </TooltipContent>
        </Tooltip>
        
        {/* Median line */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn("absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full", colors.median)}
              style={{ left: `${medianPos}%`, marginLeft: '-2px' }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <span className="font-medium">Median:</span> {formatValue(median)}
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Value labels */}
      <div className="flex justify-between items-start text-[10px]">
        <div className="text-muted-foreground">
          <div>{formatValue(min)}</div>
        </div>
        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-3">
            <span className="text-muted-foreground">
              Median: <span className="font-medium text-foreground">{formatValue(median)}</span>
            </span>
            <span className="text-muted-foreground">
              Avg: <span className="font-medium text-foreground">{formatValue(average)}</span>
            </span>
          </div>
        </div>
        <div className="text-muted-foreground text-right">
          <div>{formatValue(max)}</div>
        </div>
      </div>
    </div>
  );
}
