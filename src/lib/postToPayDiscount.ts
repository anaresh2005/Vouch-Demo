// Demo discount curve (Henry, November 2, 2026): deliberately more generous than any live brand.
// Everyone gets at least 25% off; from 1,000 followers the discount rises linearly to 100% off
// at 2,500 followers, rounded to the nearest 5%.
export const DEMO_FLOOR_PERCENT = 25;
export const DEMO_RAMP_START_FOLLOWERS = 1_000;
export const DEMO_FULL_DISCOUNT_FOLLOWERS = 2_500;

export function demoDiscountPercent(followers: number): number {
  if (!Number.isFinite(followers)) return DEMO_FLOOR_PERCENT;
  const progress = Math.min(1, Math.max(0,
    (followers - DEMO_RAMP_START_FOLLOWERS) / (DEMO_FULL_DISCOUNT_FOLLOWERS - DEMO_RAMP_START_FOLLOWERS),
  ));
  const percent = DEMO_FLOOR_PERCENT + (100 - DEMO_FLOOR_PERCENT) * progress;
  return Math.round(percent / 5) * 5;
}

export interface PostToPayQuote {
  percent: number;
  priceCents: number;
  /** The discount the shopper keeps by posting. */
  balanceCents: number;
  /** What the shopper pays today. */
  depositCents: number;
}

export function quote(followers: number, priceCents: number): PostToPayQuote {
  const percent = demoDiscountPercent(followers);
  const balanceCents = Math.round(priceCents * percent / 100);
  return { percent, priceCents, balanceCents, depositCents: priceCents - balanceCents };
}
