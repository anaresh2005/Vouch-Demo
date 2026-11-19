import type { Brand } from '@dashboard/types/vouch';

// What shopper emails tell customers about the post: ideas to try and what the brand would
// love them to mention. The limits match the database checks in 20261005090000_brand_messaging.sql.
export type BrandMessaging = { post_ideas: string[]; post_messaging: string };

export const MAX_POST_IDEAS = 5;
export const MAX_IDEA_LENGTH = 120;
export const MAX_MESSAGING_LENGTH = 200;

// Vouch's defaults, also the column defaults, so every brand starts with them filled in.
export const DEFAULT_BRAND_MESSAGING: BrandMessaging = {
  post_ideas: [
    'Film yourself opening your order and sharing your first reaction.',
    'Show how you use or enjoy it in your everyday routine.',
    "Share what made you choose it and who you'd recommend it to.",
  ],
  post_messaging: 'your honest first impression, and what you like most about it.',
};

export const messagingFromBrand = (brand: Brand): BrandMessaging =>
  ({ post_ideas: [...brand.post_ideas], post_messaging: brand.post_messaging });

/** Trims each entry and drops idea boxes left empty, as stored. */
export function tidyMessaging(messaging: BrandMessaging): BrandMessaging {
  return {
    post_ideas: messaging.post_ideas.map(idea => idea.trim()).filter(Boolean),
    post_messaging: messaging.post_messaging.trim(),
  };
}

/** Returns a message describing the first problem once tidied, or null when it can be saved. */
export function validateMessaging(messaging: BrandMessaging): string | null {
  const { post_ideas: ideas, post_messaging: mention } = tidyMessaging(messaging);
  if (ideas.length === 0) return 'Add at least one post idea.';
  if (ideas.length > MAX_POST_IDEAS) return `Keep it to ${MAX_POST_IDEAS} post ideas.`;
  if (ideas.some(idea => idea.length > MAX_IDEA_LENGTH)) return `Keep each post idea to ${MAX_IDEA_LENGTH} characters.`;
  if (!mention) return 'Say what you would love customers to mention.';
  if (mention.length > MAX_MESSAGING_LENGTH) return `Keep what you'd love customers to mention to ${MAX_MESSAGING_LENGTH} characters.`;
  return null;
}

export const sameMessaging = (a: BrandMessaging, b: BrandMessaging) =>
  a.post_messaging === b.post_messaging && a.post_ideas.length === b.post_ideas.length && a.post_ideas.every((idea, i) => idea === b.post_ideas[i]);
