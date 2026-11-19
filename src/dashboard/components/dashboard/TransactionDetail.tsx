import { formatMoney } from '@dashboard/lib/dashboardMoney';
import { agreementLines } from '@dashboard/lib/checkoutDashboard';
import { formatTimelineDate } from '@dashboard/lib/format';
import type { CheckoutTransaction } from '@dashboard/types/checkout';

/**
 * Below a Post to Pay gift's figures: its products and the agreement the customer accepted. Vouch's
 * servicing, settlement and payment checks are run by Vouch and aren't shown or offered to merchants
 * (owner decision, October 24).
 */
export function TransactionDetail({ transaction: t }: { transaction: CheckoutTransaction }) {
  const lines = agreementLines(t.agreement);
  const currency = t.agreement.currency ?? t.payment?.currency;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-subdued">{lines.length === 1 ? 'Product' : 'Products'}</p>
        <ul className="mt-0.5 max-w-md space-y-0.5 text-foreground">
          {lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span className="min-w-0">
                {line.title}
                {line.variantTitle && line.variantTitle !== 'Default Title' && <span className="text-muted-foreground"> · {line.variantTitle}</span>}
                {line.quantity > 1 && <span className="text-muted-foreground"> × {line.quantity}</span>}
              </span>
              <span className="shrink-0 tabular-nums">{formatMoney(line.lineSubtotalCents / 100, currency)}</span>
            </li>
          ))}
        </ul>
        {t.repricedAtOrder && <p className="mt-1 text-xs text-muted-foreground">Repriced at checkout to what the customer bought.</p>}
      </div>
      {!t.payment?.verified && (
        <p className="text-xs text-muted-foreground">Vouch is checking this order's payment with Shopify. Nothing is needed from you.</p>
      )}
      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">Agreement the customer accepted</summary>
        <div className="mt-2 space-y-2 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          <p>Accepted {formatTimelineDate(t.acceptedAt, { time: true })} · Version {t.agreement.termsVersion}{t.consent ? '' : ' · Acceptance record unavailable'}</p>
          {t.agreement.postingRequirements && <p className="whitespace-pre-wrap text-foreground">{t.agreement.postingRequirements}</p>}
          <p className="max-h-60 overflow-auto whitespace-pre-wrap">{t.agreement.terms}</p>
        </div>
      </details>
    </div>
  );
}
