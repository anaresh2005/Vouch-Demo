import { Instagram } from 'lucide-react';
import { TikTokIcon } from '@dashboard/components/icons/TikTokIcon';
import { cn } from '@dashboard/lib/utils';
import { embedUrl } from '@dashboard/lib/postEmbed';
import type { VouchPost } from '@dashboard/types/vouch';

// Vouch stores no copy of the media, so a post is shown through Instagram's or TikTok's own embed.
// The embed is a picture only: it ignores clicks and is skipped by the keyboard.
// The design preview's invented posts can't be embedded, so there it shows a labelled sample tile.
export function PostPreview({ post, className }: { post: Pick<VouchPost, 'post_url' | 'platform'> & { influencer?: { full_name?: string | null } | null }; className?: string }) {
  const src = embedUrl(post.post_url);
  const PlatformIcon = post.platform === 'instagram' ? Instagram : TikTokIcon;

  if (src) {
    return (
      <div className={cn('relative aspect-[4/5] overflow-hidden bg-secondary', className)}>
        <iframe
          src={src}
          title={`${post.platform === 'instagram' ? 'Instagram' : 'TikTok'} post by ${post.influencer?.full_name ?? 'creator'}`}
          loading="lazy"
          scrolling="no"
          tabIndex={-1}
          allow="encrypted-media"
          className="pointer-events-none absolute inset-0 h-[140%] w-full border-0"
        />
      </div>
    );
  }

  const sample = import.meta.env.MODE === 'design-preview';
  return (
    <div className={cn('relative flex aspect-[4/5] flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground', className)}>
      <PlatformIcon className="h-6 w-6" />
      <span className="text-sm">{sample ? 'Sample post' : 'Preview unavailable'}</span>
      {sample && <span className="absolute left-2 top-2 rounded bg-foreground/80 px-1.5 py-0.5 text-[11px] font-medium text-background">Sample</span>}
    </div>
  );
}
