import type { AccountStats, BrandRequirements } from '@/types/vouch';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  /** If true, follower minimum passed and sponsored posts should be checked next */
  needsSponsoredCheck: boolean;
}

/** Phase 1: Only follower count determines the audience requirement. */
export function checkFollowers(
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
    needsSponsoredCheck: reasons.length === 0,
  };
}

/**
 * Phase 2: Check sponsored posts count (called only after phase 1 passes).
 */
export function checkSponsoredPosts(
  sponsoredPosts30d: number,
  requirements: BrandRequirements
): EligibilityResult {
  const reasons: string[] = [];

  if (sponsoredPosts30d > requirements.max_sponsored_posts_30d) {
    reasons.push(
      `Max ${requirements.max_sponsored_posts_30d} sponsored posts in 30 days (you have ${sponsoredPosts30d})`
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    needsSponsoredCheck: false,
  };
}

/**
 * Legacy combined check (kept for non-checkout usage).
 */
export function checkEligibility(
  stats: AccountStats,
  requirements: BrandRequirements
): { eligible: boolean; reasons: string[] } {
  const phase1 = checkFollowers(stats, requirements);
  if (!phase1.eligible) {
    return { eligible: false, reasons: phase1.reasons };
  }
  const phase2 = checkSponsoredPosts(stats.sponsoredPosts30d, requirements);
  return {
    eligible: phase2.eligible,
    reasons: [...phase1.reasons, ...phase2.reasons],
  };
}
