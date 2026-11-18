import { CancelOrder } from './CancelOrder';
import { RecordDelivery } from './RecordDelivery';
import { TransactionDetail } from './TransactionDetail';
import { formatMoney } from '@dashboard/lib/dashboardMoney';
import { useEffect, useState, type ReactNode } from 'react';
import { Check, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { InfoTip } from '@dashboard/components/ui/info-tip';
import { useBrand } from '@dashboard/hooks/useBrandData';
import { formatTimelineDate } from '@dashboard/lib/format';
import { hasShipped, orderStage } from '@dashboard/lib/orderStage';
import { cn } from '@dashboard/lib/utils';
import type { CheckoutTransaction } from '@dashboard/types/checkout';
import type { VouchOrder, VouchPost } from '@dashboard/types/vouch';

type StepState = 'done' | 'current' | 'upcoming';
type Step = { label: string; state: StepState; date: string | null; projected?: boolean; note?: ReactNode };

const DAY = 86_400_000;

const CARRIERS: Record<string, string> = { ups: 'UPS', fedex: 'FedEx', usps: 'USPS', dhl: 'DHL' };

// Why an order was canceled, in the Cancel order dialog's words; Vouch's own reasons (such as
// "Card declined" after the card hold failed every retry) are shown as recorded.
const CANCEL_NOTES: Record<string, string> = {
  not_brand_safe: "The account isn't brand safe",
  not_real_person: "The account isn't run by a real person",
  'Card declined': 'Card declined; refunded by Vouch',
};

const when = (iso: string) => formatTimelineDate(iso, { time: true });
const day = (iso: string) => formatTimelineDate(iso);
const money = formatMoney;

function timeLeft(deadline: string, now: number) {
  const minutes = Math.floor((new Date(deadline).getTime() - now) / 60_000);
  if (minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h ${minutes % 60}m left`;
}

/** Time left to post, updated every half minute. */
function LiveCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const left = timeLeft(deadline, now);
  if (!left) return null;
  return (
    <span role="timer" aria-label={`Time left to post: ${left.replace(' left', '')}`} className="inline-flex items-center gap-1 font-medium text-warning">
      <Clock aria-hidden="true" className="h-3.5 w-3.5" />{left.replace(' left', '')}
    </span>
  );
}

/**
 * A gift's journey as the same four steps for every order: placed, in transit, delivered, then the
 * post (which ends as posted or charged). Steps that haven't happened show their expected dates,
 * worked out from the delivery (or its estimate) and the brand's posting window.
 */
function stepsFor(order: VouchOrder, post: VouchPost | null | undefined, windowDays: number | undefined): Step[] {
  const stage = orderStage(order);
  const transaction = order.transaction;
  const delivered = !!order.delivered_at || (!transaction && ['awaiting_post', 'charge_pending', 'posted', 'charged'].includes(stage));
  const shipped = hasShipped(order);
  const carrierName = order.shipping_carrier ? CARRIERS[order.shipping_carrier.toLowerCase()] ?? order.shipping_carrier : null;

  // Without a recorded deadline, project one from the actual delivery once it's known, otherwise
  // from the estimate. The backend sets the real deadline, so it stays "Expected".
  const projectFrom = order.delivered_at ?? order.estimated_delivery_at;
  const projectedDeadline = !order.post_deadline && projectFrom && windowDays
    ? new Date(new Date(projectFrom).getTime() + windowDays * DAY).toISOString()
    : null;

  let outcome: Step;
  if (stage === 'posted') {
    // A Post to Pay post shows once Vouch's review passed it; "Discount confirmed" once Shopify shows the balance waived.
    outcome = { label: 'Posted', state: 'done', date: transaction ? transaction.outcomeObservedAt ?? transaction.postDetectedAt : post?.detected_at ?? null,
      note: transaction ? (transaction.outcome === 'waived' ? 'Discount confirmed' : undefined) : post ? undefined : 'Post verified' };
  } else if (stage === 'charged') {
    outcome = { label: 'Charged', state: 'done', date: order.charged_at, note: transaction ? 'Remaining payment collected' : 'No post by the deadline' };
  } else if (stage === 'cancelled' && !transaction?.cancellation && transaction?.conclusion) {
    outcome = { label: 'Canceled', state: 'done', date: transaction.conclusion.at, note: 'Vouch was removed from the store, so nothing more is payable' };
  } else if (stage === 'cancelled') {
    const reason = transaction?.cancellation?.reason;
    outcome = { label: 'Canceled', state: 'done', date: transaction?.cancellation?.requestedAt ?? null,
      note: reason ? CANCEL_NOTES[reason] ?? reason : 'Canceled and refunded in Shopify' };
  } else if (stage === 'charge_pending') {
    outcome = { label: 'Charge pending', state: 'current', date: null,
      note: transaction?.decision?.kind === 'missed' ? 'No qualifying post' : order.post_deadline ? `No post by the ${day(order.post_deadline)} deadline` : 'No post by the deadline' };
  } else if (order.post_deadline) {
    outcome = { label: 'Post due', state: delivered ? 'current' : 'upcoming', date: order.post_deadline };
  } else {
    outcome = {
      label: 'Post due', state: delivered ? 'current' : 'upcoming', date: projectedDeadline, projected: true,
      note: projectedDeadline ? undefined : windowDays ? `${windowDays} ${windowDays === 1 ? 'day' : 'days'} after delivery` : 'After delivery',
    };
  }

  return [
    { label: 'Order placed', state: 'done', date: order.created_at },
    { label: 'In transit', state: shipped ? 'done' : 'current', date: null, note: shipped ? (carrierName ? `Shipped with ${carrierName}` : 'Shipped') : 'Waiting for tracking' },
    delivered
      ? { label: 'Delivered', state: 'done', date: order.delivered_at, note: order.delivered_at ? undefined : 'Delivered' }
      : { label: 'Delivered', state: shipped ? 'current' : 'upcoming', date: order.estimated_delivery_at, projected: true, note: order.estimated_delivery_at ? undefined : 'Date not known yet' },
    outcome,
  ];
}

function Dot({ state }: { state: StepState }) {
  if (state === 'done') {
    return <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>;
  }
  if (state === 'current') {
    return <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary shadow-[0_0_0_2px_hsl(var(--primary))]"><span className="h-1.5 w-1.5 rounded-full bg-primary" /></span>;
  }
  return <span className="relative z-10 block h-4 w-4 shrink-0 rounded-full bg-secondary shadow-[0_0_0_1.5px_hsl(var(--border))]" />;
}

function Detail({ label, children, info }: { label: string; children: ReactNode; info?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-subdued">{label}{info && <InfoTip label={`About ${label}`}>{info}</InfoTip>}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}

const HELD_INFO = "Held on the customer's card until Vouch reviews their post. Released if the post is approved; collected if it isn't.";
const BALANCE_INFO = "What the customer still owes, including any amount held on their card. It's waived when their post is approved and collected if it isn't.";

/** A Post to Pay gift's money, from Shopify's verified payment: what was collected, held and is still owed. */
function CheckoutFigures({ t }: { t: CheckoutTransaction }) {
  const p = t.payment;
  const cents = (amount: number | undefined) => amount === undefined ? <span className="text-muted-foreground">Unavailable</span> : money(amount / 100, p?.currency);
  return (
    <>
      <Detail label="Collected" info="What Shopify has received from the customer for this order so far.">{cents(p?.paidCents)}</Detail>
      {(p?.otherItemsCents ?? 0) > 0 && <Detail label="Other items (paid in full)">{cents(p?.otherItemsCents)}</Detail>}
      {(p?.shippingCents ?? 0) > 0 && !p?.deferredShippingCents && <Detail label="Shipping (paid in full)">{cents((p?.shippingCents ?? 0) + (p?.shippingTaxCents ?? 0))}</Detail>}
      <Detail label="Card hold" info={HELD_INFO}>{cents(p?.authorizedCents)}</Detail>
      <Detail label="Balance" info={BALANCE_INFO}>{cents(p?.outstandingCents)}</Detail>
      {(p?.roundingRefundCents ?? 0) > 0 && <Detail label="Rounding refund">{cents(p?.roundingRefundCents)}{(p?.roundingRefundDueCents ?? 0) > 0 ? ' (not yet refunded)' : ''}</Detail>}
    </>
  );
}

// On wide screens the steps sit on a six-column grid: the first step starts at the left edge, the
// middle two are centred at one and two thirds, and the last ends at the right edge, so the line
// spans the full width of the panel. On narrow screens the steps stack vertically.
const PLACEMENT = [
  'sm:col-span-1 sm:items-start sm:text-left',
  'sm:col-span-2 sm:items-center sm:text-center',
  'sm:col-span-2 sm:items-center sm:text-center',
  'sm:col-span-1 sm:items-end sm:text-right',
];
// Horizontal segments between the dots' centres (dots are 16px wide; the outer ones sit at the edges).
const SEGMENTS = ['left-2 right-2/3', 'left-1/3 right-1/3', 'left-2/3 right-2'];

/** The inside of an expanded gift row: its timeline, then what the gift cost (for Post to Pay, its products and agreement too). */
export function OrderTimeline({ order, post }: { order: VouchOrder; post?: VouchPost | null }) {
  const { brand } = useBrand();
  const steps = stepsFor(order, post, order.transaction ? order.transaction.agreement.servicing?.postingWindowDays : brand?.posting_window_days);
  const currency = order.currency;
  const stage = orderStage(order);

  async function copyTracking(event: React.MouseEvent) {
    event.stopPropagation();
    if (!order.tracking_number) return;
    // Confirm only once the browser has copied it; clipboard access can be blocked or unavailable.
    try {
      await navigator.clipboard.writeText(order.tracking_number);
      toast.success('Tracking number copied');
    } catch {
      toast.error('Could not copy the tracking number. Select it and copy it yourself.');
    }
  }

  return (
    <div className="space-y-5 pb-1 pt-2">
      <ol aria-label="Gift progress" className="relative flex flex-col gap-5 sm:grid sm:grid-cols-6 sm:gap-0">
        {SEGMENTS.map((position, index) => (
          <span key={position} aria-hidden="true" className={cn(
            'absolute top-2 hidden h-px sm:block', position,
            steps[index + 1].state === 'upcoming' ? 'border-t border-dashed border-border' : 'bg-primary',
          )} />
        ))}
        {steps.map((step, index) => (
          <li key={step.label} aria-current={step.state === 'current' ? 'step' : undefined}
            className={cn('relative grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 sm:flex sm:flex-col sm:gap-3', PLACEMENT[index])}>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className={cn(
                'absolute left-2 top-4 h-[calc(100%+1.25rem)] w-px sm:hidden',
                steps[index + 1].state === 'upcoming' ? 'border-l border-dashed border-border' : 'bg-primary',
              )} />
            )}
            <Dot state={step.state} />
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>{step.label}</p>
              {step.date && <p className="text-xs text-muted-foreground">{step.projected ? `Expected ${day(step.date)}` : when(step.date)}</p>}
              {step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
              {step.label === 'Delivered' && order.transaction && <RecordDelivery order={order} />}
            </div>
          </li>
        ))}
      </ol>

      {/* The figures, with "Cancel order" (when it applies) in the bottom-right corner, level with the last line. */}
      <div className="flex items-end gap-x-10 gap-y-3 pt-4 shadow-[inset_0_1px_0_hsl(var(--border))]">
        <dl className="flex min-w-0 flex-1 flex-wrap gap-x-10 gap-y-3">
          <Detail label="Retail">{money(order.retail_total, currency) ?? '—'}</Detail>
          {order.transaction && <CheckoutFigures t={order.transaction} />}
          <Detail label="Tracking number">
            {order.tracking_number ? (
              <button type="button" onClick={copyTracking} className="inline-flex max-w-full items-center gap-1 hover:text-primary" aria-label={`Copy tracking number ${order.tracking_number}`}>
                <span className="truncate">{order.tracking_number}</span><Copy aria-hidden="true" className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            ) : <span className="text-muted-foreground">Not recorded</span>}
          </Detail>
          {stage === 'awaiting_post' && order.post_deadline && (
            <Detail label="Time left to post"><LiveCountdown deadline={order.post_deadline} /></Detail>
          )}
        </dl>
        <CancelOrder order={order} />
      </div>
      {order.transaction && <section aria-label="Products and agreement" className="pt-4 shadow-[inset_0_1px_0_hsl(var(--border))]">
        <TransactionDetail transaction={order.transaction} />
      </section>}
    </div>
  );
}
