export const POST_TO_PAY_MIN_FOLLOWERS = 2_500;
export const POST_TO_PAY_FULL_DISCOUNT_FOLLOWERS = 10_000;
export const POST_TO_PAY_BASE_DISCOUNT = 10;

export interface PostToPayQuote {
  discountPercent: number;
  savings: number;
  amountDue: number;
}

/** Eligibility is checked separately. Accounts below the follower minimum receive no discount. */
export function calculatePostToPayQuote(
  followers: number,
  orderTotal: number,
  isEligible: boolean,
): PostToPayQuote {
  const progress = Math.min(1, Math.max(0,
    (followers - POST_TO_PAY_MIN_FOLLOWERS) /
    (POST_TO_PAY_FULL_DISCOUNT_FOLLOWERS - POST_TO_PAY_MIN_FOLLOWERS),
  ));
  const discountPercent = isEligible && Number.isFinite(followers) && followers >= POST_TO_PAY_MIN_FOLLOWERS
    ? POST_TO_PAY_BASE_DISCOUNT + (100 - POST_TO_PAY_BASE_DISCOUNT) * progress
    : 0;
  // Round only the money, so the underlying discount scales linearly.
  const totalCents = Math.round(orderTotal * 100);
  const savingsCents = Math.round(totalCents * discountPercent / 100);
  return {
    discountPercent,
    savings: savingsCents / 100,
    amountDue: (totalCents - savingsCents) / 100,
  };
}
