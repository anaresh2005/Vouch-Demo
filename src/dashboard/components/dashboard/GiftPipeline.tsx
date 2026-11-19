import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@dashboard/components/ui/tooltip';
import { postDueLabel } from '@dashboard/lib/format';
import { orderStage, STAGE_LABELS, type OrderStage } from '@dashboard/lib/orderStage';
import { cn } from '@dashboard/lib/utils';
import type { VouchOrder } from '@dashboard/types/vouch';
import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';

// Owner decision, October 24: placed → in transit once it ships → awaiting post once delivery is confirmed →
// posted or charged once there's an outcome or the posting period ends (Charge pending sits here, about to be charged).
const PHASES: { label: string; caption: string; stages: OrderStage[] }[] = [
  { label: 'Order placed', caption: 'Waiting to ship', stages: ['placed'] },
  { label: 'In transit', caption: 'On the way', stages: ['in_transit'] },
  { label: 'Awaiting post', caption: 'Delivery confirmed', stages: ['awaiting_post'] },
  { label: 'Posted or charged', caption: 'Post made or deadline passed', stages: ['posted', 'charged', 'charge_pending'] },
];
const MAX_FACES = 6;

// Same placement as a gift's own timeline: first phase at the left edge, middle two centred,
// last at the right edge, so the two read as the same journey.
const PLACEMENT = [
  'sm:col-span-1 sm:items-start sm:text-left',
  'sm:col-span-2 sm:items-center sm:text-center',
  'sm:col-span-2 sm:items-center sm:text-center',
  'sm:col-span-1 sm:items-end sm:text-right',
];
const SEGMENTS = ['left-2 right-2/3', 'left-1/3 right-1/3', 'left-2/3 right-2'];
const FACES_ALIGN = ['sm:justify-start', 'sm:justify-center', 'sm:justify-center', 'sm:justify-end'];

function statusFor(order: VouchOrder) {
  const stage = orderStage(order);
  if (stage === 'awaiting_post' && order.post_deadline) return postDueLabel(order.post_deadline).label;
  return STAGE_LABELS[stage];
}

/**
 * Where every gift is right now, as one line: each phase shows the creators currently in it.
 * Active gifts (including Charge pending) appear whenever they were ordered; finished ones only if they
 * finished in `completed`.
 */
export function GiftPipeline({ active, completed }: { active: VouchOrder[]; completed: VouchOrder[] }) {
  const inPhase = (phase: (typeof PHASES)[number]) => {
    const source = phase.stages.includes('posted') ? [...completed, ...active] : active;
    const orders = source.filter(o => phase.stages.includes(orderStage(o)));
    return phase.stages.includes('awaiting_post')
      ? orders.sort((a, b) => new Date(a.post_deadline ?? 0).getTime() - new Date(b.post_deadline ?? 0).getTime())
      : orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <TooltipProvider delayDuration={100}>
      <section aria-labelledby="pipeline-heading" className="rounded-lg bg-card p-4 shadow-edge sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="pipeline-heading" className="text-sm font-semibold text-foreground">Gift pipeline</h2>
          <Link to="/dashboard/orders" className="text-sm font-medium text-primary hover:text-primary-hover">View gifts</Link>
        </div>
        <ol className="relative flex flex-col gap-6 sm:grid sm:grid-cols-6 sm:gap-0">
          {SEGMENTS.map(position => (
            // Photos sit above the line on wide screens: a 32px row plus a 12px gap puts the dots' centres at 52px.
            <span key={position} aria-hidden="true" className={cn('absolute top-[52px] hidden h-px bg-primary sm:block', position)} />
          ))}
          {PHASES.map((phase, index) => {
            const orders = inPhase(phase);
            const shown = orders.slice(0, MAX_FACES);
            return (
              <li key={phase.label} className={cn('relative flex flex-col gap-2 sm:gap-3', PLACEMENT[index])}>
                <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary"><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>
                <div>
                  <p className="text-sm font-medium text-foreground">{phase.label} <span className="font-normal text-muted-foreground">{orders.length}</span></p>
                  <p className="text-xs text-muted-foreground">{phase.caption}</p>
                </div>
                {orders.length === 0 ? (
                  <p className="flex items-center text-xs text-faint sm:order-first sm:h-8">No one here</p>
                ) : (
                  <ul className={cn('flex flex-wrap gap-1.5 sm:order-first sm:h-8 sm:flex-nowrap sm:gap-0 sm:-space-x-1.5', FACES_ALIGN[index])}>
                    {shown.map(order => {
                      const name = order.influencer?.full_name ?? 'Unknown creator';
                      const status = statusFor(order);
                      return (
                        <li key={order.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/dashboard/orders?expand=${order.id}`} aria-label={`${name}: ${status}. Open their gift.`}
                                className="relative block rounded-full transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                                <VerifiedInfluencerAvatar initial={name.charAt(0)} imageUrl={order.influencer?.profile_image_url} className="ring-2 ring-card" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>{name} · {status}</TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    })}
                    {orders.length > shown.length && (
                      <li>
                        <Link to="/dashboard/orders" className="relative flex h-8 min-w-8 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium text-subdued shadow-edge ring-2 ring-card hover:bg-accent">
                          +{orders.length - shown.length}
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </TooltipProvider>
  );
}
