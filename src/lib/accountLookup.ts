import type { AccountStats, SocialPlatform } from '@/types/vouch';
import { supabase } from '@/integrations/supabase/client';

// The demo's one live feature: a real Instagram or TikTok profile scan through the demo
// project's Modash proxy (supabase/functions/modash-checkout-lookup).

export class AccountNotFoundError extends Error {}

// Session-level caches to avoid redundant Modash API calls
const usernameCache: Record<string, AccountStats> = {};

// Instant local lookup for the 6 known demo influencer accounts — no API call needed
// ERs derived from Raw API with Discovery API-aligned methodology:
//   - Instagram: likes + comments, 3x-median outlier filter, 30-post window, followers denominator
//   - TikTok: likes + comments, 30-post window, views denominator (industry standard)
// Last synced: 2026-02-19
const DEMO_ACCOUNTS: Record<string, AccountStats> = {
  'tiktok:notesbymatt': {
    followers: 82900, engagementRate: 20.2, sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdndcWjI1YCUI7Ntb7Q3CSKRvVGLVKBylKUJ3f5TYO0QUOTFZx2l4d51%2FzUtg7YIpiUJwRI4JTktFvB6vx0Sq1dNxPILAM8fpD0MvXCujQ%2BitL8Z8i8JvgFZ8PPdUsb%2FB%2B',
    displayName: 'notesbymatt',
  },
  'tiktok:dotcomliam': {
    followers: 17900, engagementRate: 17.5, sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdhGZ4C1P8UlOxc9xRG7WjtvwLvxAo657fpqECoULWUNVzct9tjANVEGUHYjaxAedprnA08hxBc636DqpniC1t5Nyx5XMF263rLiVIYCVzMLSSanzxo0BIQsninJgchm%2BB',
    displayName: 'dotcomliam',
  },
  'instagram:brandonbalfourr': {
    followers: 851856, engagementRate: 1, sponsoredPosts30d: 1,
    verified: true,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYL6m5yO74YemwShEOZw8ll5KnwBNgPL3uS53ZNVF4TQXAsOvBSUK7qFqNzM%2BFQXu6GHFXWdQJ7%2FSYbgOKOsCn3Xt%2FYzeksBPYLUknr5ild2A%3D%3D',
    displayName: 'Brandon Balfour',
  },
  'instagram:bryce_witmer': {
    followers: 84202, engagementRate: 1, sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY9F5GYbaeWl4lnJ0Tkae%2FaLehpzNllDPh27pIO7gH770oDUFiY3ACnIweGlh44jF68wwDvKQQ3vg7OSWgHSJ2pgNlJUwVYqIiahjW32e%2BqWA%3D%3D',
    displayName: 'Bryce Witmer ✞',
  },
  'instagram:colekosco': {
    followers: 256178, engagementRate: 0.2, sponsoredPosts30d: 0,
    verified: true,
    profileImageUrl: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZ%2Fuc3eREMYRmlucP5lauWcXQjRijKh1Zi4z9%2F7WSNr2mcbXYXB2b84FbdjZyfGuAGAlExjVTya3d4MMAhCJdutWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D',
    displayName: 'Cole Kosco',
  },
  'tiktok:dylanasuarez': {
    followers: 9999, engagementRate: 6.4, sponsoredPosts30d: 0,
    verified: false,
    profileImageUrl: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5J7TeKh0ZEBR026e3SbZ2zlI1hu5l%2FBllGBWaUUBrUa5pzjGDtlInvUplh%2B%2BPx1qvjkxnQU968Rp9vwUAZ9M%2F5wg5wjaQPsN7lXz%2FNh%2BeaLQP7%2F319P2k%2F1dcITajqRah',
    displayName: 'dylanasuarez',
  },
};

/** Resolves the account's stats, throws AccountNotFoundError when the account doesn't exist, or another error when the scan fails. */
export async function lookupUsername(username: string, platform: SocialPlatform): Promise<AccountStats> {
  const cleanUsername = username.toLowerCase().replace('@', '').trim();
  const cacheKey = `${platform}:${cleanUsername}`;
  // Known demo accounts answer instantly, with no API call.
  const known = DEMO_ACCOUNTS[cacheKey] ?? usernameCache[cacheKey];
  if (known) return known;

  const { data, error } = await supabase.functions.invoke('modash-checkout-lookup', {
    body: { platform, username: cleanUsername },
  });
  // A non-2xx reply arrives as `error`, with the function's JSON body on its response.
  const body = error ? await error.context?.json?.().catch(() => null) : data;
  if (body?.code === 'not_found') throw new AccountNotFoundError(cleanUsername);
  if (error || body?.error || !body?.data) throw new Error(body?.message ?? 'Account lookup failed');

  const profile = body.data;
  const result: AccountStats = {
    followers: profile.followers,
    engagementRate: profile.engagementRate ?? 0,
    sponsoredPosts30d: profile.sponsoredPosts30d,
    verified: profile.verified,
    profileImageUrl: profile.profileImageUrl,
    displayName: profile.displayName,
  };
  usernameCache[cacheKey] = result;
  return result;
}
