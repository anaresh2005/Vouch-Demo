import { PostToPayQuote } from '@/lib/postToPayDiscount';

export function DiscountSummary({ quote }: { quote: PostToPayQuote }) {
  return (
    <div className="space-y-2 py-1" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Posting discount ({quote.discountPercent.toLocaleString('en-US', { maximumFractionDigits: 2 })}%)</span>
        <span className="font-medium tabular-nums text-primary">−${quote.savings.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
        <span>Due today</span>
        <span className="tabular-nums">${quote.amountDue.toFixed(2)}</span>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Post within 72 hours of delivery to keep your discount. Otherwise, the remaining ${quote.savings.toFixed(2)} is charged.
      </p>
    </div>
  );
}
