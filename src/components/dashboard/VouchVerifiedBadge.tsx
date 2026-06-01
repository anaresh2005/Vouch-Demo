import { CircleCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VouchVerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function VouchVerifiedBadge({ className, size = 'sm' }: VouchVerifiedBadgeProps) {
  const sizeClasses = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-6 h-6';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CircleCheck 
            className={cn(sizeClasses, 'inline-block flex-shrink-0 text-primary fill-primary stroke-primary-foreground dark:fill-vouch-periwinkle dark:stroke-card', className)}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified Vouch Influencer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
