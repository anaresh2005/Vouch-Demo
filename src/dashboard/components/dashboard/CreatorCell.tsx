import { Instagram } from 'lucide-react';
import type { Influencer } from '@dashboard/types/vouch';
import { TikTokIcon } from '@dashboard/components/icons/TikTokIcon';
import { creatorOn, formatCompact } from '@dashboard/lib/format';
import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';

// A creator shown the same way everywhere: photo, name, then platform, handle and follower count.
export function CreatorCell({ influencer, platform }: { influencer: Influencer | null | undefined; platform: 'instagram' | 'tiktok' }) {
  const { handle, followers } = creatorOn(influencer, platform);
  const PlatformIcon = platform === 'instagram' ? Instagram : TikTokIcon;
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <VerifiedInfluencerAvatar initial={influencer?.full_name?.charAt(0) || '?'} imageUrl={influencer?.profile_image_url} />
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{influencer?.full_name ?? 'Unknown creator'}</span>
        {/* When space runs out the handle truncates; the follower count always stays visible. */}
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <PlatformIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">@{handle || 'unknown'}</span>
          <span className="shrink-0 whitespace-nowrap">· {formatCompact(followers)}</span>
        </span>
      </span>
    </span>
  );
}
