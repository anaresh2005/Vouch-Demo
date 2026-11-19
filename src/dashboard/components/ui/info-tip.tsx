import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@dashboard/components/ui/tooltip';

/** A small info icon that explains a label on hover or focus, in a light tooltip. */
export function InfoTip({ children, label = 'More information' }: { children: ReactNode; label?: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger type="button" className="ml-1 inline-flex align-[-2px] text-muted-foreground hover:text-foreground" aria-label={label}>
          <Info className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] bg-card text-sm font-normal text-body shadow-float">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
