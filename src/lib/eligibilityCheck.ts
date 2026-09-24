import type { AccountStats, BrandRequirements } from '@/types/vouch';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/** Checkout eligibility depends only on follower count. */
export function checkEligibility(
  stats: AccountStats,
  requirements: BrandRequirements
): EligibilityResult {
  const reasons: string[] = [];
  if (!Number.isFinite(stats.followers) || stats.followers < requirements.min_followers) {
    reasons.push(
      `Need ${requirements.min_followers.toLocaleString()}+ followers (you have ${stats.followers.toLocaleString()})`
    );
  }
  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
