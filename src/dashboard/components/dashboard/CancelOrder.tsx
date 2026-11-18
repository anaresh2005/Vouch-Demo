import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dashboard/components/ui/dialog';
import { useToast } from '@dashboard/hooks/use-toast';
import { useBrandProfile } from '@dashboard/hooks/useBrandData';
import { checkoutRequest } from '@dashboard/lib/checkoutApi';
import { hasShipped } from '@dashboard/lib/orderStage';
import type { VouchOrder } from '@dashboard/types/vouch';

export type CancelReason = 'not_brand_safe' | 'not_real_person';

// The same two standards the shopper's "order canceled" email explains.
const REASONS: { value: CancelReason; label: string; detail: string }[] = [
  { value: 'not_brand_safe', label: "The account isn't brand safe", detail: 'For example, profanity, nudity or violence on the account.' },
  { value: 'not_real_person', label: "The account isn't run by a real person", detail: 'The account shows signs of being automated.' },
];

/**
 * A quiet "Cancel order" control in the corner of a Post to Pay gift's figures, for when a review finds the
 * customer's account unsafe before the order ships. It asks the transaction service to cancel; the gift only
 * changes once that service confirms. Older gifting orders can't be canceled from Vouch, so they get none.
 */
export function CancelOrder({ order }: { order: VouchOrder }) {
  const t = order.transaction;
  const { profile } = useBrandProfile();
  const canManageBrand = profile?.brand_role === 'owner' || profile?.brand_role === 'admin';
  const cache = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Only before the order ships (owner decision): once in transit, or decided, it isn't offered.
  if (!t || !canManageBrand || hasShipped(order) || t.outcome || t.decision || t.cancellation || t.conclusion) return null;
  const name = t.payment?.orderName ?? null;
  const transactionId = t.id;

  async function confirm() {
    if (!reason) return;
    setBusy(true); setError('');
    try {
      await checkoutRequest('cancel_order', { transactionId, reason });
      setOpen(false);
      toast({ title: 'Order canceled', description: `${name ?? 'The order'} was canceled in Shopify.` });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The cancellation was not confirmed.');
    } finally {
      setBusy(false);
      await cache.invalidateQueries({ queryKey: ['orders', profile?.brand_id] });
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(''); setReason(null); setOpen(true); }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-destructive focus-visible:outline focus-visible:outline-2">
        <XCircle aria-hidden="true" className="h-3.5 w-3.5" />Cancel order
      </button>
      <Dialog open={open} onOpenChange={next => !busy && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {name ?? 'this order'}?</DialogTitle>
            <DialogDescription>
              Use this when a review finds the customer's account isn't right for Post to Pay, before the order ships.
              The order is canceled in Shopify, what the customer paid is refunded, and any hold on their card is released.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={busy} className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-foreground">Why are you canceling it?</legend>
            {REASONS.map(option => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" name={`cancel-reason-${order.id}`} value={option.value} checked={reason === option.value}
                  onChange={() => setReason(option.value)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
                <span><span className="font-medium text-foreground">{option.label}</span><span className="block text-muted-foreground">{option.detail}</span></span>
              </label>
            ))}
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">Could not cancel the order. {error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Keep order</Button>
            <Button type="button" variant="destructive" disabled={!reason || busy} onClick={confirm}>{busy ? 'Canceling…' : 'Cancel order'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
