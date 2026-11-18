import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Instagram } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@dashboard/components/ui/dialog';
import { InfoTip } from '@dashboard/components/ui/info-tip';
import { TikTokIcon } from '@dashboard/components/icons/TikTokIcon';
import { exportPostToMarkdown } from '@dashboard/lib/markdownExport';
import { CPM_FORMULA, calculatePostCPM, formatCPM, calculatePostEMV, formatEMV } from '@dashboard/lib/cpmUtils';
import { creatorOn, formatCompact } from '@dashboard/lib/format';
import { useEMVSettings } from '@dashboard/hooks/useEMVSettings';
import { usePriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import { cn } from '@dashboard/lib/utils';
import type { VouchPost, VouchOrder } from '@dashboard/types/vouch';
import { AdRights } from './AdRights';
import { ExportDropdown } from './ExportDropdown';
import { PostPreview } from './PostPreview';
import { ReportPost } from './ReportPost';
import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';

interface PostDetailDialogProps {
  post: VouchPost;
  order?: VouchOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A label/value row in a Stripe-style details list. */
function Row({ label, info, highlight = false, children }: { label: string; info?: string; highlight?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 shadow-[inset_0_-1px_0_hsl(var(--divider))]">
      <dt className={cn('text-sm', highlight ? 'font-medium text-primary' : 'text-muted-foreground')}>
        {label}{info && <InfoTip label={`About ${label}`}>{info}</InfoTip>}
      </dt>
      <dd className={cn('text-right text-sm font-medium', highlight ? 'text-primary' : 'text-foreground')}>{children}</dd>
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function PostDetailDialog({ post, order, open, onOpenChange }: PostDetailDialogProps) {
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();

  if (!post) return null;

  const { handle, followers } = creatorOn(post.influencer, post.platform);
  const PlatformIcon = post.platform === 'instagram' ? Instagram : TikTokIcon;
  const cpm = calculatePostCPM(post, order);
  const emv = calculatePostEMV(post, emvSettings);
  const profileLink = `/dashboard/influencers?id=${post.influencer_id}`;

  const handleExportPDF = async () => {
    const { exportPostToPDF } = await import('@dashboard/lib/pdfExport');
    await exportPostToPDF(post, order);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <div className="absolute right-12 top-5">
          <ExportDropdown label="Download post report" onExportPDF={handleExportPDF} onExportMarkdown={() => exportPostToMarkdown(post, order)} />
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-normal">
            <Link to={profileLink} onClick={() => onOpenChange(false)} className="hover:opacity-80">
              <VerifiedInfluencerAvatar initial={post.influencer?.full_name?.charAt(0) || '?'} imageUrl={post.influencer?.profile_image_url} size="md" />
            </Link>
            <span className="min-w-0">
              <Link to={profileLink} onClick={() => onOpenChange(false)} className="block truncate text-base font-semibold text-heading hover:text-primary">
                {post.influencer?.full_name ?? 'Unknown creator'}
              </Link>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <PlatformIcon className="h-3.5 w-3.5" />@{handle || 'unknown'} · {formatCompact(followers)} followers
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="space-y-3">
            <PostPreview post={post} className="rounded-lg shadow-edge" />
            <div className="flex items-center justify-between gap-2">
              <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-card px-2 text-sm font-medium text-secondary-foreground shadow-edge hover:bg-secondary">
                View post<ExternalLink aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">Ad rights <AdRights post={post} /></span>
            </div>
            <ReportPost post={post} />
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Performance</h3>
              <dl>
                <Row label="Views">{formatCompact(post.views)}</Row>
                <Row label="Likes">{formatCompact(post.likes)}</Row>
                <Row label="Comments">{post.comments ?? '—'}</Row>
                <Row label="Engagement rate" info="(Likes + comments) ÷ views for this post.">{post.engagement_rate ? `${post.engagement_rate}%` : '—'}</Row>
                <Row label="CPM" highlight={priorityMetric === 'cpm'} info={`Cost per 1,000 views: ${CPM_FORMULA}. Lower is better. Shown once what the creator paid is recorded.`}>{formatCPM(cpm, order?.currency)}</Row>
                <Row label="EMV" highlight={priorityMetric === 'emv'} info="Earned media value: (likes + comments) × the value per engagement set in Settings. Higher is better. Shown once both likes and comments are recorded.">{formatEMV(emv)}</Row>
              </dl>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">Details</h3>
              <dl>
                <Row label="Posted">{when(post.detected_at)}</Row>
                <Row label="Platform">{post.platform === 'instagram' ? 'Instagram' : 'TikTok'}</Row>
                {order && (
                  <Row label="Gift">
                    <Link to={`/dashboard/orders?expand=${order.id}`} onClick={() => onOpenChange(false)} className="text-primary hover:text-primary-hover">View gift</Link>
                  </Row>
                )}
              </dl>
            </section>

            <section className="rounded-lg border border-dashed border-border p-3">
              <h3 className="text-sm font-semibold text-foreground">Not available yet</h3>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                <li>Caption text is not available. Open the original post to read it.</li>
                <li>Individual comments are not available. The recorded comment count is shown above.</li>
                <li>Sales attribution is unavailable: product sales and attribution data are not connected.</li>
                <li>Historical measurements are not available. Metrics show the latest recorded totals.</li>
              </ul>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
