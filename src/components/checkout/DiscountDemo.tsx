import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { calculatePostToPayQuote, POST_TO_PAY_MIN_FOLLOWERS, POST_TO_PAY_FULL_DISCOUNT_FOLLOWERS } from '@/lib/postToPayDiscount';

interface DiscountDemoProps {
  orderTotal: number;
  disabled: boolean;
  onSelect: (followers: number) => void;
}

export function DiscountDemo({ orderTotal, disabled, onSelect }: DiscountDemoProps) {
  const [followers, setFollowers] = useState(POST_TO_PAY_MIN_FOLLOWERS);
  const id = useId();
  const quote = calculatePostToPayQuote(followers, orderTotal, true);

  return (
    <details className="group rounded-xl border border-border bg-card p-3 sm:p-4 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        Try a demo follower count
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border mt-3 pt-4">
        <div className="flex items-center justify-between gap-2 font-medium tabular-nums">
          <label htmlFor={id}>{followers.toLocaleString()} followers</label>
          <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">{quote.discountPercent.toLocaleString('en-US', { maximumFractionDigits: 2 })}% off</span>
        </div>
        <input
          id={id}
          type="range"
          min={POST_TO_PAY_MIN_FOLLOWERS}
          max={POST_TO_PAY_FULL_DISCOUNT_FOLLOWERS}
          step={250}
          value={followers}
          onChange={(event) => setFollowers(Number(event.target.value))}
          disabled={disabled}
          className="block h-5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>2.5K · 10% off</span>
          <span>10K+ · 100% off</span>
        </div>
        <div className="space-y-2 border-t border-border pt-3" aria-live="polite">
          <div className="flex justify-between text-muted-foreground">
            <span>You save by posting</span>
            <span className="tabular-nums text-foreground">−${quote.savings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>You pay today</span>
            <span className="tabular-nums">${quote.amountDue.toFixed(2)}</span>
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full h-9 text-sm" disabled={disabled} onClick={() => onSelect(followers)}>
          Use demo profile
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">Simulated account with no sponsored posts.</p>
      </div>
    </details>
  );
}
