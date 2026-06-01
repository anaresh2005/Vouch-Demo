import { AccountStats, BrandRequirements } from '@/types/vouch';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  /** If true, follower/engagement passed and sponsored posts should be checked next */
  needsSponsoredCheck: boolean;
}

/**
 * Phase 1: Check followers and engagement with flexible thresholds.
 * High followers compensate for low engagement and vice versa.
 */
export function checkFollowersAndEngagement(
  stats: AccountStats,
  requirements: BrandRequirements
): EligibilityResult {
  const reasons: string[] = [];

  const followerRatio = stats.followers / requirements.min_followers;
  const engagementRatio = stats.engagementRate / requirements.min_engagement_rate;

  // High followers compensate for low engagement
  const engagementMultiplier =
    followerRatio >= 100 ? 0.1 :
    followerRatio >= 50 ? 0.15 :
    followerRatio >= 10 ? 0.25 :
    followerRatio >= 5 ? 0.5 :
    followerRatio >= 3 ? 0.75 :
    1;

  // High engagement compensates for low followers
  const followerMultiplier =
    engagementRatio >= 3 ? 0.4 :
    engagementRatio >= 2 ? 0.6 :
    engagementRatio >= 1.5 ? 0.8 :
    1;

  const adjustedMinFollowers = Math.floor(requirements.min_followers * followerMultiplier);
  const adjustedMinEngagement = +(requirements.min_engagement_rate * engagementMultiplier).toFixed(2);

  if (stats.followers < adjustedMinFollowers) {
    reasons.push(
      `Need ${adjustedMinFollowers.toLocaleString()}+ followers (you have ${stats.followers.toLocaleString()})`
    );
  }

  // engagementRate of 0 means Raw API couldn't calculate it (empty feed) — skip the gate
  if (stats.engagementRate > 0 && stats.engagementRate < adjustedMinEngagement) {
    reasons.push(
      `Need ${adjustedMinEngagement}%+ engagement rate (yours is ${stats.engagementRate}%)`
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
  const phase1 = checkFollowersAndEngagement(stats, requirements);
  if (!phase1.eligible) {
    return { eligible: false, reasons: phase1.reasons };
  }
  const phase2 = checkSponsoredPosts(stats.sponsoredPosts30d, requirements);
  return {
    eligible: phase2.eligible,
    reasons: [...phase1.reasons, ...phase2.reasons],
  };
}
