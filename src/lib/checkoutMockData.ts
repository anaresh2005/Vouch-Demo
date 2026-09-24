import { CartItem, CheckoutBrand, AccountStats } from '@/types/vouch';
import { POST_TO_PAY_MIN_FOLLOWERS } from './postToPayDiscount';
import { supabase } from '@/integrations/supabase/client';
import productShorts from '@/assets/product-shorts.png';
import productSunglasses from '@/assets/product-sunglasses.png';
import stylecoLogo from '@/assets/styleco-logo.png';

export const mockCartItems: CartItem[] = [
  {
    id: '1',
    name: 'Classic Shorts',
    price: 79.99,
    quantity: 1,
    imageUrl: productShorts,
  },
  {
    id: '2',
    name: 'Designer Sunglasses',
    price: 129.99,
    quantity: 1,
    imageUrl: productSunglasses,
  },
];

export const mockBrand: CheckoutBrand = {
  id: 'brand-1',
  name: 'StyleCo',
  logoUrl: stylecoLogo,
  instagramUsername: 'styleco_official',
  tiktokUsername: 'styleco',
  requirements: {
    min_followers: POST_TO_PAY_MIN_FOLLOWERS,
    max_sponsored_posts_30d: 5,
  },
};

// Session-level caches to avoid redundant Modash API calls
const usernameCache: Record<string, AccountStats | null> = {};
const collaborationsCache: Record<string, number> = {};

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

export async function lookupUsername(username: string, platform: string = 'instagram'): Promise<AccountStats | null> {
  const cleanUsername = username.toLowerCase().replace('@', '').trim();
  
  if (cleanUsername.length === 0) {
    return null;
  }

  const cacheKey = `${platform}:${cleanUsername}`;

  // Instant return for known demo accounts — no API call, no latency
  if (DEMO_ACCOUNTS[cacheKey]) {
    console.log(`[Demo account] Instant lookup for ${cacheKey}`);
    return DEMO_ACCOUNTS[cacheKey];
  }

  if (cacheKey in usernameCache) {
    console.log(`[Cache hit] lookupUsername ${cacheKey}`);
    return usernameCache[cacheKey];
  }

  try {
    const { data, error } = await supabase.functions.invoke('modash-checkout-lookup', {
      body: { platform, username: cleanUsername },
    });

    if (error) {
      console.error('Edge function error:', error);
      return null;
    }

    if (data?.error) {
      if (data.code === 'not_found') {
        console.log(`Account not found: ${cleanUsername}`);
        usernameCache[cacheKey] = null;
        return null;
      }
      console.error('Modash API error:', data.message);
      usernameCache[cacheKey] = null;
      return null;
    }

    const profileData = data.data;
    const result: AccountStats = {
      followers: profileData.followers,
      engagementRate: profileData.engagementRate ?? 0,
      sponsoredPosts30d: profileData.sponsoredPosts30d,
      verified: profileData.verified,
      profileImageUrl: profileData.profileImageUrl,
      displayName: profileData.displayName,
    };
    usernameCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error('Failed to lookup username via Modash:', err);
    usernameCache[cacheKey] = null;
    return null;
  }
}

export async function lookupCollaborations(username: string, platform: string = 'instagram'): Promise<number> {
  const cleanUsername = username.toLowerCase().replace('@', '').trim();
  
  const cacheKey = `${platform}:${cleanUsername}`;

  // Instant return for known demo accounts
  if (DEMO_ACCOUNTS[cacheKey]) {
    return DEMO_ACCOUNTS[cacheKey].sponsoredPosts30d;
  }

  if (cacheKey in collaborationsCache) {
    console.log(`[Cache hit] lookupCollaborations ${cacheKey}`);
    return collaborationsCache[cacheKey];
  }

  try {
    const { data, error } = await supabase.functions.invoke('modash-collaborations', {
      body: { platform, username: cleanUsername },
    });

    if (error) {
      console.error('Collaborations edge function error:', error);
      collaborationsCache[cacheKey] = 0;
      return 0;
    }

    const result = data?.sponsoredPosts30d ?? 0;
    collaborationsCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error('Failed to lookup collaborations:', err);
    collaborationsCache[cacheKey] = 0;
    return 0;
  }
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
