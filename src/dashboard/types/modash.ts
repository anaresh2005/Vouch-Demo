// Response returned by the modash-profile edge function.
export interface ModashProfileData {
  // When Vouch fetched this from Modash (saved creator profiles, October 24); refreshed after 7 days.
  fetchedAt?: string | null;
  followers: number | null;
  engagementRate: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  avgShares: number | null;
  postsCount: number | null;
  postingFrequency: string | null;
  nonSponsoredPostsMedianViews?: number | null;
  nonSponsoredPostsMedianLikes?: number | null;
  sponsoredPostsMedianViews?: number | null;
  sponsoredPostsMedianLikes?: number | null;
  paidPostPerformance?: number | null;
  paidPostPerformanceViews?: number | null;
  audience: {
    countries: { country: string; percentage: number }[];
    cities: { city: string; percentage: number }[];
    languages: { language: string; percentage: number }[];
    ages: { range: string; percentage: number }[];
    genders: { type: string; percentage: number }[];
    interests: string[];
    credibility: number | null;
    notableUsers?: { userId: string; username: string; fullname: string; picture: string | null; followers: number | null; isVerified: boolean; engagementRate: number | null; url: string }[];
  };
  lookalikes?: { userId: string; username: string; fullname: string; picture: string | null; followers: number | null; isVerified: boolean; engagementRate: number | null; url: string }[];
  recentPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number | null; likes: number | null; comments: number | null; shares: number | null; created: string }[];
  popularPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number | null; likes: number | null; comments: number | null; shares: number | null; created: string }[];
  sponsoredPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number | null; likes: number | null; comments: number | null; shares: number | null; created: string; mentions?: string[] }[];
}
