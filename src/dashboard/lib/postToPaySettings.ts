import type { Brand } from '@dashboard/types/vouch';

export type UsesPeriod = 'week' | 'month' | 'year' | 'lifetime';
export const USES_PERIODS: UsesPeriod[] = ['week', 'month', 'year', 'lifetime'];

// The Post to Pay settings a brand chooses at setup and can change in Settings.
// While a form is being filled in, an empty number box is NaN and an unchosen period is ''.
export type PostToPaySettings = {
  min_followers: number;
  discount_at_min_percent: number;
  full_discount_followers: number;
  floor_discount_percent: number | null;
  /** The most one order can save, in the store's currency; null means no cap. */
  max_discount_amount: number | null;
  combine_with_other_discounts: boolean;
  min_engagement_rate: number;
  free_express_shipping: boolean;
  posting_window_days: number;
  max_uses_per_customer: number;
  uses_period: UsesPeriod | '';
  instagram_username: string | null;
  tiktok_username: string | null;
};

// Vouch's recommended values, as proposed to Crave'n Cups on 9/25. Shown as grayed-out
// placeholders: brands type their own values rather than accepting these by default.
export const SUGGESTED_SETTINGS: PostToPaySettings = {
  min_followers: 2500,
  discount_at_min_percent: 10,
  full_discount_followers: 10000,
  floor_discount_percent: null,
  max_discount_amount: null,
  combine_with_other_discounts: false,
  min_engagement_rate: 0,
  free_express_shipping: true,
  posting_window_days: 3,
  max_uses_per_customer: 1,
  uses_period: 'month',
  instagram_username: null,
  tiktok_username: null,
};

export function settingsFromBrand(brand: Brand): PostToPaySettings {
  return {
    min_followers: brand.min_followers,
    discount_at_min_percent: Number(brand.discount_at_min_percent),
    full_discount_followers: brand.full_discount_followers,
    floor_discount_percent: brand.floor_discount_percent === null ? null : Number(brand.floor_discount_percent),
    max_discount_amount: brand.max_discount_amount === null ? null : Number(brand.max_discount_amount),
    combine_with_other_discounts: brand.combine_with_other_discounts,
    min_engagement_rate: Number(brand.min_engagement_rate),
    free_express_shipping: brand.free_express_shipping,
    posting_window_days: brand.posting_window_days,
    max_uses_per_customer: brand.max_uses_per_customer,
    uses_period: brand.uses_period as UsesPeriod,
    instagram_username: brand.instagram_username,
    tiktok_username: brand.tiktok_username,
  };
}

// A new brand's form: numbers left blank (the recommendations show as placeholders).
export const BLANK_SETTINGS: PostToPaySettings = {
  ...SUGGESTED_SETTINGS,
  min_followers: NaN,
  discount_at_min_percent: NaN,
  full_discount_followers: NaN,
  posting_window_days: NaN,
  max_uses_per_customer: NaN,
  uses_period: '',
};

/**
 * Discount for an eligible account with this many followers: the floor below the minimum
 * (or null if accounts below it are not eligible), then rising in a straight line from the
 * discount at the minimum to 100% at full_discount_followers.
 */
export function discountForFollowers(settings: PostToPaySettings, followers: number): number | null {
  if (followers < settings.min_followers) return settings.floor_discount_percent;
  if (followers >= settings.full_discount_followers) return 100;
  const span = settings.full_discount_followers - settings.min_followers;
  const progress = span > 0 ? (followers - settings.min_followers) / span : 1;
  const discount = settings.discount_at_min_percent + progress * (100 - settings.discount_at_min_percent);
  return Math.round(Math.max(discount, settings.floor_discount_percent ?? 0));
}

export type SocialPlatform = 'instagram' | 'tiktok';

// Merchants often paste a profile link instead of the handle, e.g. https://www.instagram.com/yourbrand/?hl=en
// or tiktok.com/@yourbrand, so the handle is taken from the link.
const PROFILE_LINKS: Record<SocialPlatform, RegExp> = {
  instagram: /^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([^/?#]+)\/?(?:[?#].*)?$/i,
  tiktok: /^(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([^/?#]+)\/?(?:[?#].*)?$/i,
};
// Instagram allows 1–30 letters, numbers, periods and underscores; TikTok 2–24 of the same.
const HANDLE_RULES: Record<SocialPlatform, RegExp> = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
};

/** The bare handle from what was typed: without spaces or a leading "@", and taken out of a profile link. */
export function normalizeHandle(value: string | null, platform: SocialPlatform): string {
  const typed = (value ?? '').trim();
  const profile = typed.match(PROFILE_LINKS[platform]);
  // Content/navigation URLs are not profile links, even when they have one path segment.
  if (profile && platform === 'instagram' && /^(p|reel|reels|stories|explore|accounts|direct)$/i.test(profile[1])) return typed;
  return (profile?.[1] ?? typed).replace(/^@/, '');
}

const isWhole = (value: number) => Number.isInteger(value) && value >= 0;
const isPercent = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
// Positive, at most two decimal places (cents), and within the database column's numeric(12,2).
const isMoney = (value: number) => Number.isFinite(value) && value > 0 && value < 1e10 && Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

export type SettingsSection = 'handles' | 'discounts' | 'rules';

/** Returns a message describing the first problem in one part of the settings, or null when it is complete. */
export function validateSettingsSection(settings: PostToPaySettings, section: SettingsSection): string | null {
  if (section === 'handles') {
    const instagram = normalizeHandle(settings.instagram_username, 'instagram');
    const tiktok = normalizeHandle(settings.tiktok_username, 'tiktok');
    if (!instagram) return 'Enter the Instagram handle customers should tag.';
    if (!HANDLE_RULES.instagram.test(instagram)) {
      return 'Enter a valid Instagram handle: up to 30 letters, numbers, periods or underscores. Paste a profile link, not a post link.';
    }
    if (tiktok && !HANDLE_RULES.tiktok.test(tiktok)) {
      return 'Enter a valid TikTok handle: 2 to 24 letters, numbers, periods or underscores. Paste a profile link, not a video link.';
    }
    return null;
  }
  if (section === 'discounts') {
    if (!isWhole(settings.min_followers)) return 'Enter a whole number of minimum followers.';
    if (!isPercent(settings.discount_at_min_percent)) return 'The discount at the minimum must be between 0% and 100%.';
    if (!isWhole(settings.full_discount_followers) || settings.full_discount_followers < settings.min_followers) {
      return 'Followers needed for 100% off must be at least the minimum followers.';
    }
    if (settings.floor_discount_percent !== null && !isPercent(settings.floor_discount_percent)) {
      return 'The minimum discount for all accounts must be between 0% and 100%.';
    }
    if (settings.max_discount_amount !== null && !isMoney(settings.max_discount_amount)) {
      return 'Enter a maximum discount above zero, in dollars and cents.';
    }
    return null;
  }
  if (!isPercent(settings.min_engagement_rate)) return 'The minimum engagement rate must be between 0% and 100%.';
  if (!Number.isInteger(settings.posting_window_days) || settings.posting_window_days < 1 || settings.posting_window_days > 30) {
    return 'Allow between 1 and 30 days to post after delivery.';
  }
  if (!Number.isInteger(settings.max_uses_per_customer) || settings.max_uses_per_customer < 1 || settings.max_uses_per_customer > 100) {
    return 'Allow each customer between 1 and 100 uses.';
  }
  if (!settings.uses_period) return 'Choose how often each customer can Post to Pay.';
  return null;
}

/** Returns a message describing the first problem, or null when the settings can be saved. */
export function validateSettings(settings: PostToPaySettings): string | null {
  return validateSettingsSection(settings, 'discounts')
    ?? validateSettingsSection(settings, 'rules')
    ?? validateSettingsSection(settings, 'handles');
}
