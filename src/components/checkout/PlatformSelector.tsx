import { Instagram } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { SocialPlatform } from '@/types/vouch';
import { cn } from '@/lib/utils';

interface PlatformSelectorProps {
  onSelect: (platform: SocialPlatform) => void;
}

export function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        Select where you'll post about your purchase
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelect('instagram')}
          className={cn(
            'flex items-center gap-2.5 p-3 rounded-xl border-2 border-border',
            'bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200',
            'focus:outline-none'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
            <Instagram className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">Instagram</span>
            <span className="text-[10px] text-muted-foreground">Post or Reel</span>
          </div>
        </button>

        <button
          onClick={() => onSelect('tiktok')}
          className={cn(
            'flex items-center gap-2.5 p-3 rounded-xl border-2 border-border',
            'bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200',
            'focus:outline-none'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <TikTokIcon className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">TikTok</span>
            <span className="text-[10px] text-muted-foreground">Video</span>
          </div>
        </button>
      </div>
    </div>
  );
}
