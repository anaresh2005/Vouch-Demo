export type SocialPlatform = 'instagram' | 'tiktok' | 'snapchat' | 'youtube' | 'x' | 'facebook' | 'pinterest' | 'linkedin' | 'substack';
/** Platforms the demo can scan through Modash. */
export type ScannedPlatform = Extract<SocialPlatform, 'instagram' | 'tiktok'>;

export interface AccountStats {
  followers: number;
  engagementRate: number;
  sponsoredPosts30d: number;
  verified: boolean;
  profileImageUrl: string | null;
  displayName: string | null;
}
