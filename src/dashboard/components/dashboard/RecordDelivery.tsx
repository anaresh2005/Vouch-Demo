import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@dashboard/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@dashboard/components/ui/dialog';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { useToast } from '@dashboard/hooks/use-toast';
import { useBrandProfile } from '@dashboard/hooks/useBrandData';
import { checkoutRequest } from '@dashboard/lib/checkoutApi';
import { hasShipped } from '@dashboard/lib/orderStage';
import type { VouchOrder } from '@dashboard/types/vouch';

/**
 * A quiet "Mark as delivered" link under the timeline's Delivered step (owner decision, October 24): the
 * fallback for a carrier without tracking, since Shopify's delivery time normally starts the posting window.
 * Shown to owners and admins only once the order has shipped and while no delivery is recorded.
 */
export function RecordDelivery({ order }: { order: VouchOrder }) {
  const t = order.transaction;
  const { profile } = useBrandProfile();
  const canManageBrand = profile?.brand_role === 'owner' || profile?.brand_role === 'admin';
  const cache = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [delivered, setDelivered] = useState('');
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!t?.servicing || !canManageBrand || t.delivery.deliveredAt || !hasShipped(order)
    || t.outcome || t.cancellation || t.conclusion) return null;

  async function confirm() {
    setBusy(true); setError('');
    try {
      await checkoutRequest('record_delivery', { transactionId: t!.id, deliveredAt: new Date(delivered).toISOString(), evidence });
      setOpen(false);
      toast({ title: 'Delivery recorded', description: 'The posting window has started.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The delivery was not recorded.');
    } finally {
      setBusy(false);
      await cache.invalidateQueries({ queryKey: ['orders', profile?.brand_id] });
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(''); setOpen(true); }}
        className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2">
        Mark as delivered
      </button>
      <Dialog open={open} onOpenChange={next => !busy && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {t.payment?.orderName ?? 'this order'} as delivered?</DialogTitle>
            <DialogDescription>
              Use this only when the carrier has no tracking and you've confirmed the delivery. The customer's posting
              window starts from the time you enter. Shipping dates and estimates don't count.
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={busy} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`delivered-${t.id}`}>Delivered at (your local time)</Label>
              <Input id={`delivered-${t.id}`} type="datetime-local" value={delivered} onChange={e => setDelivered(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`evidence-${t.id}`}>How you confirmed it</Label>
              <Input id={`evidence-${t.id}`} value={evidence} maxLength={2000} placeholder="For example, the customer confirmed by email"
                onChange={e => setEvidence(e.target.value)} />
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">Could not record the delivery. {error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!delivered || evidence.trim().length < 10 || busy} onClick={confirm}>
              {busy ? 'Recording…' : 'Mark as delivered'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
