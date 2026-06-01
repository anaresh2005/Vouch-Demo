import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedInfluencerAvatarProps {
  initial: string;
  imageUrl?: string | null;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerifiedInfluencerAvatar({ 
  initial, 
  imageUrl,
  isVerified, 
  size = 'sm',
  className 
}: VerifiedInfluencerAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  }[size];
  
  const ringClasses = isVerified 
    ? 'ring-2 ring-primary dark:ring-[#4A54E2] ring-offset-2 ring-offset-card' 
    : '';

  const avatar = (
    <div 
      className={cn(
        'rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 overflow-hidden border border-border',
        sizeClasses,
        ringClasses,
        className
      )}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={initial} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fall back to initial letter on image load failure
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={cn(imageUrl ? 'hidden' : '')}>{initial}</span>
    </div>
  );

  if (!isVerified) {
    return avatar;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatar}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified Vouch Influencer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
