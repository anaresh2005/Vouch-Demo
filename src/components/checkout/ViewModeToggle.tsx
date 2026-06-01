import { Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'desktop' | 'mobile';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('desktop')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          viewMode === 'desktop'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Desktop</span>
      </button>
      <button
        onClick={() => onViewModeChange('mobile')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          viewMode === 'mobile'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );
}
