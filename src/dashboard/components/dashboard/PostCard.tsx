import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { calculatePostCPM, calculatePostEMV, formatCPM, formatEMV } from '@dashboard/lib/cpmUtils';
import { formatCompact, formatDate } from '@dashboard/lib/format';
import type { EMVSettings } from '@dashboard/hooks/useEMVSettings';
import type { PriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import { cn } from '@dashboard/lib/utils';
import type { VouchOrder, VouchPost } from '@dashboard/types/vouch';
import { AdRights } from './AdRights';
import { CreatorCell } from './CreatorCell';
import { PostPreview } from './PostPreview';

type Props = {
  post: VouchPost;
  order: VouchOrder | undefined;
  priorityMetric: PriorityMetric;
  emvSettings: EMVSettings;
  onOpen: () => void;
  highlighted?: boolean;
};

// One post as a card: the post itself, who made it, how it did, and the ad-rights action.
// Used on the Posts page and the Overview.
export const PostCard = forwardRef<HTMLLIElement, Props>(({ post, order, priorityMetric, emvSettings, onOpen, highlighted = false }, ref) => {
  const priorityLabel = priorityMetric === 'cpm' ? 'CPM' : 'EMV';
  const priorityValue = priorityMetric === 'cpm' ? formatCPM(calculatePostCPM(post, order), order?.currency) : formatEMV(calculatePostEMV(post, emvSettings));
  return (
    <li ref={ref} className={cn('flex flex-col overflow-hidden rounded-lg bg-card shadow-edge transition-shadow', highlighted && 'shadow-[0_0_0_2px_hsl(var(--primary))]')}>
      <button type="button" onClick={onOpen} className="block text-left focus-visible:outline-none" tabIndex={-1} aria-hidden="true">
        <PostPreview post={post} />
      </button>
      {/* The card body is a size container: stats sit in one row of four only when there is room for
          the widest labels and values ("Comments", "$73.60"), otherwise a 2×2 grid. */}
      <div className="flex flex-1 flex-col gap-3 p-3 [container-type:inline-size]">
        {/* The ad-rights control drops below the creator when the card is too narrow for both. */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link to={`/dashboard/influencers?id=${post.influencer_id}`} className="min-w-0 grow basis-40 hover:opacity-80">
            <CreatorCell influencer={post.influencer} platform={post.platform} />
          </Link>
          <AdRights post={post} />
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm [@container(min-width:22rem)]:grid-cols-4">
          {[
            ['Views', formatCompact(post.views)],
            ['Likes', formatCompact(post.likes)],
            ['Comments', formatCompact(post.comments)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
          <div className="min-w-0">
            <dt className="text-xs text-primary">{priorityLabel}</dt>
            <dd className={cn('font-medium', priorityValue === '—' ? 'text-muted-foreground' : 'text-primary')}>{priorityValue}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground shadow-[inset_0_1px_0_hsl(var(--divider))]">
          <span>Posted {formatDate(post.detected_at)}</span>
          <span className="flex items-center gap-3">
            <button type="button" aria-label={`View details for post by ${post.influencer?.full_name ?? 'creator'}`}
              className="rounded text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2"
              onClick={onOpen}>Details</button>
            <a href={post.post_url} target="_blank" rel="noopener noreferrer" aria-label="Open the post"
              className="flex text-muted-foreground hover:text-primary">
              <ExternalLink className="h-4 w-4" />
            </a>
          </span>
        </div>
      </div>
    </li>
  );
});
PostCard.displayName = 'PostCard';
