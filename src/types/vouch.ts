export type SocialPlatform = 'instagram' | 'tiktok';

export type VouchOrderStatus = 
  | 'pending_delivery' 
  | 'delivered' 
  | 'post_pending' 
  | 'post_verified' 
  | 'charged' 
  | 'completed';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  instagram_username: string | null;
  tiktok_username: string | null;
  min_followers: number;
  min_engagement_rate: number;
  max_sponsored_posts_30d: number;
  estimated_shipping_days: number;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  brand_id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type InfluencerCategory = 
  | 'Fashion & Beauty'
  | 'Health & Fitness'
  | 'Food & Cooking'
  | 'Travel & Adventure'
  | 'Tech & Gaming'
  | 'Lifestyle'
  | 'Home & Decor'
  | 'Parenting & Family';

export interface Influencer {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  bio: string | null;
  category: InfluencerCategory;
  profile_image_url: string | null;
  instagram_username: string | null;
  instagram_followers: number | null;
  instagram_engagement_rate: number | null;
  instagram_verified: boolean;
  tiktok_username: string | null;
  tiktok_followers: number | null;
  tiktok_engagement_rate: number | null;
  tiktok_verified: boolean;
  sponsored_posts_30d: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedInfluencer {
  id: string;
  brand_id: string;
  influencer_id: string;
  notes: string | null;
  created_at: string;
  influencer?: Influencer;
}

export interface VouchOrder {
  id: string;
  brand_id: string;
  influencer_id: string;
  shopify_order_id: string | null;
  order_total: number;
  cogs: number | null;
  sales_tax: number | null;
  shipping_cost: number | null;
  items_count: number;
  currency: string;
  platform: SocialPlatform;
  status: VouchOrderStatus;
  tracking_number: string | null;
  shipping_carrier: 'ups' | 'fedex' | 'usps' | 'dhl' | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  post_deadline: string | null;
  charged_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  influencer?: Influencer;
  brand?: Brand;
}

export interface VouchPost {
  id: string;
  order_id: string;
  influencer_id: string;
  brand_id: string;
  platform: SocialPlatform;
  post_url: string;
  post_id: string | null;
  likes: number;
  comments: number;
  views: number;
  engagement_rate: number | null;
  boosting_rights_granted: boolean;
  detected_at: string;
  created_at: string;
  influencer?: Influencer;
  order?: VouchOrder;
}

export interface BrandRequirements {
  min_followers: number;
  min_engagement_rate: number;
  max_sponsored_posts_30d: number;
}

// Checkout-related types
export interface AccountStats {
  followers: number;
  engagementRate: number;
  sponsoredPosts30d: number;
  verified: boolean;
  profileImageUrl: string | null;
  displayName: string | null;
}

export interface CheckoutSession {
  platform: SocialPlatform | null;
  username: string;
  accountStats: AccountStats | null;
  isEligible: boolean;
  eligibilityReasons: string[];
  email: string;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface CheckoutBrand {
  id: string;
  name: string;
  logoUrl: string;
  instagramUsername: string;
  tiktokUsername: string;
  requirements: BrandRequirements;
}
