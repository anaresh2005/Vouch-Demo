import { PostToPayQuote } from '@/lib/postToPayDiscount';

export function DiscountSummary({ quote }: { quote: PostToPayQuote }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3 text-xs sm:text-sm" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">Post to Pay</span>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tabular-nums text-primary">{quote.discountPercent.toLocaleString('en-US', { maximumFractionDigits: 2 })}% off</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>You save by posting</span>
        <span className="font-medium tabular-nums text-foreground">−${quote.savings.toFixed(2)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
        <span>You pay today</span>
        <span className="tabular-nums">${quote.amountDue.toFixed(2)}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Post within 72 hours of delivery to keep your discount. Otherwise, the remaining ${quote.savings.toFixed(2)} is charged.
      </p>
    </div>
  );
}
