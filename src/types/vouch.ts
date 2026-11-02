export type SocialPlatform = 'instagram' | 'tiktok';

export interface AccountStats {
  followers: number;
  engagementRate: number;
  sponsoredPosts30d: number;
  verified: boolean;
  profileImageUrl: string | null;
  displayName: string | null;
}
