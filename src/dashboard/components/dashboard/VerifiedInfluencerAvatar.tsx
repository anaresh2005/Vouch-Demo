import { cn } from '@dashboard/lib/utils';

interface VerifiedInfluencerAvatarProps {
  initial: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// A creator's photo, or their initial when there is none. Special markers (such as "has posted
// for Vouch") are switched off for now so they don't confuse merchants (owner, Sept 28).
export function VerifiedInfluencerAvatar({ initial, imageUrl, size = 'sm', className }: VerifiedInfluencerAvatarProps) {
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-16 h-16 text-2xl' }[size];
  return (
    <div className={cn('flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-subdued shadow-edge', sizeClasses, className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={initial}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fall back to the initial if the image fails to load.
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className={cn(imageUrl ? 'hidden' : '')}>{initial}</span>
    </div>
  );
}
