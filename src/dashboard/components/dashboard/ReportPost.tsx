import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Flag } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dashboard/components/ui/dialog';
import { useToast } from '@dashboard/hooks/use-toast';
import { useBrandRole } from '@dashboard/hooks/useBrandInvites';
import { checkoutRequest } from '@dashboard/lib/checkoutApi';
import { REPORT_REASONS, useMarkPostReported, usePostReport, type ReportReason } from '@dashboard/hooks/usePostReports';
import type { VouchPost } from '@dashboard/types/vouch';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const at = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
// The brand may flag a Post to Pay post for 24 hours after Vouch's review shows it (owner decision, October 9).
const FLAG_WINDOW_MS = 24 * 3_600_000;
type FlagChoice = 'profanity' | 'content';
const FLAG_CHOICES: { value: FlagChoice; label: string; detail: string }[] = [
  { value: 'profanity', label: 'Profanity', detail: "If Vouch confirms, the shopper has 24 hours to edit or replace the post, or they're charged the remaining balance." },
  { value: 'content', label: 'Breaks your content standards', detail: "Nudity, violence, hate or similar. If Vouch confirms, it can't be fixed and counts as a missed post." },
];
const FLAGGED_AS = { profanity: 'Flagged for profanity', content: 'Flagged as breaking your content standards' };

/** Where a flag stands, for everyone on the team: waiting for Vouch, confirmed (and what follows) or kept by Vouch. */
function FlagStatus({ post }: { post: VouchPost }) {
  const confirmed = post.flag && post.flag_source === 'merchant';
  if (!confirmed && !post.flag_request) return null;
  const kind: FlagChoice = confirmed ? (post.flag === 'fix' ? 'profanity' : 'content') : post.flag_request!;
  const on = post.flag_requested_at ?? post.reviewed_at;
  const by = post.flag_requested_by_email ?? post.reviewed_by_email;
  const next = confirmed
    ? post.flag === 'fix' && post.fix_by ? ` Vouch confirmed it; the shopper has until ${at(post.fix_by)} to fix it.` : post.flag === 'content' ? ' Vouch confirmed it; it counts as a missed post.' : ''
    : post.flag_request_resolution === 'dismissed' ? ' Vouch reviewed it and kept the post.' : ' Vouch is reviewing it.';
  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <Flag aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{FLAGGED_AS[kind]}{on ? ` on ${day(on)}` : ''}{by ? ` by ${by}` : ''}.{next}</span>
    </p>
  );
}

/** Until when the brand may flag this Post to Pay post, or null when it can't (owner decision, October 9). */
function flagUntil(post: VouchPost): number | null {
  if (!post.checkout_offer_id || post.flag || post.flag_request) return null;
  const shownAt = post.review_status === 'released' ? post.reviewed_at ?? post.review_release_at : post.review_release_at;
  const until = shownAt ? Date.parse(shownAt) + FLAG_WINDOW_MS : NaN;
  return until > Date.now() ? until : null;
}

/**
 * One "Flag post" flow for a Post to Pay post (owner decision, October 24; Merchant Terms 5.6): owners and admins,
 * once, within 24 hours of the post appearing here. Vouch staff confirm the flag before the shopper hears anything.
 * A content-standards flag also walks through reporting the post to Instagram and records that report.
 */
function FlagPost({ post, until }: { post: VouchPost; until: number }) {
  const platform = post.platform === 'instagram' ? 'Instagram' : 'TikTok';
  const cache = useQueryClient();
  const mark = useMarkPostReported();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<FlagChoice | null>(null);
  const [reported, setReported] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (!choice) return;
    setBusy(true); setError('');
    try {
      await checkoutRequest('flag_post', { postId: post.id, flag: choice });
      // The report is the brand's own record of what it did on Instagram; a failure to save it doesn't undo the flag.
      if (choice === 'content' && reported) await mark.mutateAsync({ postId: post.id, reason: reported }).catch(() => undefined);
      setOpen(false);
      toast({ title: 'Flag sent to Vouch', description: 'Vouch will review it. The shopper is only emailed if Vouch confirms it.' });
      await cache.invalidateQueries({ queryKey: ['posts'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The flag was not confirmed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(''); setChoice(null); setReported(null); setOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2">
        <Flag aria-hidden="true" className="h-3.5 w-3.5" />Flag post
      </button>
      <Dialog open={open} onOpenChange={next => !busy && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag this post?</DialogTitle>
            <DialogDescription>
              You can flag it until {at(new Date(until).toISOString())}, 24 hours after it appeared here. Vouch reviews your flag first; the shopper is only emailed if Vouch confirms it.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={busy} className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-foreground">What's wrong with it?</legend>
            {FLAG_CHOICES.map(option => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" name={`flag-${post.id}`} value={option.value} checked={choice === option.value}
                  onChange={() => setChoice(option.value)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
                <span><span className="font-medium text-foreground">{option.label}</span><span className="block text-muted-foreground">{option.detail}</span></span>
              </label>
            ))}
          </fieldset>
          {choice === 'content' && (
            <fieldset disabled={busy} className="space-y-2 rounded-md bg-secondary p-3 text-sm">
              <legend className="sr-only">Report it to {platform}</legend>
              <p className="font-medium text-foreground">You can also report it to {platform}</p>
              <ol className="list-decimal space-y-1 pl-5 text-body">
                <li>
                  <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover">
                    Open the post on {platform}<ExternalLink aria-hidden="true" className="h-3 w-3" />
                  </a>
                </li>
                <li>Click ⋯ (More options), choose Report, and follow {platform}'s steps.</li>
                <li>If you reported it, say why so your team can see it:</li>
              </ol>
              <div className="space-y-1.5 pl-5">
                {REPORT_REASONS.map(option => (
                  <label key={option.value} className="flex cursor-pointer items-center gap-2 text-foreground">
                    <input type="radio" name={`flag-report-${post.id}`} value={option.value} checked={reported === option.value}
                      onChange={() => setReported(option.value)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {error && <p role="alert" className="text-sm text-destructive">Could not flag the post. {error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!choice || busy} onClick={confirm}>{busy ? 'Sending…' : 'Flag post'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * The brand's post controls (owner decision, October 24). While a Post to Pay post can be flagged, one "Flag post"
 * flow, which also covers reporting it to Instagram; otherwise a quiet "Report to Instagram/TikTok" for posts that
 * break the brand's content standards. Neither platform lets other apps file reports, so the brand reports the post
 * there and marks it here. The flag's status and the recorded report show to the whole team.
 */
export function ReportPost({ post }: { post: VouchPost }) {
  const { canManageBrand } = useBrandRole();
  const until = canManageBrand ? flagUntil(post) : null;
  return (
    <div className="space-y-1.5">
      <FlagStatus post={post} />
      {until ? <><ReportedStatus post={post} /><FlagPost post={post} until={until} /></> : <ReportToPlatform post={post} />}
    </div>
  );
}

/** A report the team recorded, shown on its own while the flag flow stands in for the report control. */
function ReportedStatus({ post }: { post: VouchPost }) {
  const recorded = usePostReport(post.id).data;
  if (!recorded) return null;
  return <ReportedLine post={post} report={recorded} />;
}

function ReportedLine({ post, report }: { post: VouchPost; report: NonNullable<ReturnType<typeof usePostReport>['data']> }) {
  const platform = post.platform === 'instagram' ? 'Instagram' : 'TikTok';
  const why = REPORT_REASONS.find(r => r.value === report.reason)?.label ?? report.reason;
  return (
    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <Flag aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>Reported to {platform} on {day(report.reported_at)}{report.reported_by_name ? ` by ${report.reported_by_name}` : ''}. Reason: {why}.</span>
    </p>
  );
}

function ReportToPlatform({ post }: { post: VouchPost }) {
  const platform = post.platform === 'instagram' ? 'Instagram' : 'TikTok';
  const { canManageBrand } = useBrandRole();
  const recorded = usePostReport(post.id);
  const mark = useMarkPostReported();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const report = recorded.data;

  if (report) return <ReportedLine post={post} report={report} />;
  // Viewers can't record reports, and an unknown report status isn't shown as "not reported".
  if (!canManageBrand || !recorded.isSuccess) return null;

  async function confirm() {
    if (!reason) return;
    try {
      await mark.mutateAsync({ postId: post.id, reason });
      setOpen(false);
      toast({ title: 'Post marked as reported', description: `Your team can see it was reported to ${platform}.` });
    } catch {
      // Shown in the dialog; the choice is kept for retry.
    }
  }

  return (
    <>
      <button type="button" onClick={() => { mark.reset(); setOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2">
        <Flag aria-hidden="true" className="h-3.5 w-3.5" />Report to {platform}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this post to {platform}</DialogTitle>
            <DialogDescription>
              For posts that break your content standards in a way that can't be fixed, such as nudity, violence or hate.
              {' '}{platform} doesn't let other apps file reports, so you report it on {platform}, then mark it here so your team knows.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={mark.isPending} className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Why are you reporting it?</legend>
            {REPORT_REASONS.map(option => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="radio" name="report-reason" value={option.value} checked={reason === option.value}
                  onChange={() => setReason(option.value)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                {option.label}
              </label>
            ))}
          </fieldset>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-body">
            <li>
              <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover">
                Open the post on {platform}<ExternalLink aria-hidden="true" className="h-3 w-3" />
              </a>
            </li>
            <li>Click ⋯ (More options) on the post, choose Report, and follow {platform}'s steps.</li>
            <li>Come back here and mark it as reported.</li>
          </ol>
          {mark.error && <p role="alert" className="text-sm text-destructive">Could not mark the post as reported. {mark.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!reason || mark.isPending} onClick={confirm}>{mark.isPending ? 'Saving…' : 'Mark as reported'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
