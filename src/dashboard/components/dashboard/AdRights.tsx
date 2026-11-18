import { Rocket } from 'lucide-react';
import { Badge } from '@dashboard/components/ui/badge';
import type { VouchPost } from '@dashboard/types/vouch';

const ADS_MANAGER = {
  instagram: { name: 'Meta Ads Manager', url: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns' },
  tiktok: { name: 'TikTok Ads Manager', url: 'https://ads.tiktok.com/i18n/home' },
};

// Ad rights in one place: when the creator granted them, "Run ad" is itself the one-click action to
// the platform's ads manager; when they didn't, the same spot says "Not granted".
export function AdRights({ post }: { post: Pick<VouchPost, 'boosting_rights_granted' | 'platform'> }) {
  if (!post.boosting_rights_granted) {
    return <Badge className="shrink-0" title="The creator hasn't granted rights to boost or repost this post.">Not granted</Badge>;
  }
  const manager = ADS_MANAGER[post.platform];
  return (
    <a
      href={manager.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      aria-label={`Run an ad with this post in ${manager.name}`}
      className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
    >
      <Rocket aria-hidden="true" className="h-3 w-3" />Run ad
    </a>
  );
}
