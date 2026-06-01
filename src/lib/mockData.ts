import { Brand, Influencer, VouchOrder, VouchPost } from '@/types/vouch';

// Mock brand for demo purposes
export const mockBrand: Brand = {
  id: 'brand-1',
  name: 'StyleCo Fashion',
  slug: 'styleco',
  logo_url: null,
  instagram_username: 'styleco_official',
  tiktok_username: 'styleco',
  min_followers: 5000,
  min_engagement_rate: 2.5,
  max_sponsored_posts_30d: 3,
  estimated_shipping_days: 3,
  contact_email: 'partnerships@styleco.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Real influencer data sourced from Modash API
export const mockInfluencers: Influencer[] = [
  {
    id: 'inf-1',
    email: 'foundedbymatt@gmail.com',
    phone: null,
    full_name: 'Matt',
    bio: 'philippians 4:13\n------\nbusiness: @foundedbymatt\nfoundedbymatt@gmail.com\nroad to 100k followers?',
    category: 'Lifestyle',
    profile_image_url: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdndcWjI1YCUI7Ntb7Q3CSKRvVGLVKBylKUJ3f5TYO0QUOTFZx2l4d51%2FzUtg7YIpiUJwRI4JTktFvB6vx0Sq1dNxPILAM8fpD0MvXCujQ%2BitL8Z8i8JvgFZ8PPdUsb%2FB%2B',
    instagram_username: null,
    instagram_followers: null,
    instagram_engagement_rate: null,
    instagram_verified: false,
    tiktok_username: 'notesbymatt',
    tiktok_followers: 82700,
    tiktok_engagement_rate: 20.2,
    tiktok_verified: false,
    sponsored_posts_30d: 0,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inf-2',
    email: 'dotcomliam@gmail.com',
    phone: null,
    full_name: 'Liam',
    bio: 'Faith + Mindset\n📧 dotcomliam@gmail.com',
    category: 'Lifestyle',
    profile_image_url: 'https://imgigp.modash.io/v2?4e7GkPsCtkrXRAYTZgKXbafNZS%2FbrLmKITU21vToT5nPoRNzJNScV2pd2s01FnCdhGZ4C1P8UlOxc9xRG7WjtvwLvxAo657fpqECoULWUNVzct9tjANVEGUHYjaxAedprnA08hxBc636DqpniC1t5Nyx5XMF263rLiVIYCVzMLSSanzxo0BIQsninJgchm%2BB',
    instagram_username: null,
    instagram_followers: null,
    instagram_engagement_rate: null,
    instagram_verified: false,
    tiktok_username: 'dotcomliam',
    tiktok_followers: 17900,
    tiktok_engagement_rate: 1.7,
    tiktok_verified: false,
    sponsored_posts_30d: 0,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inf-3',
    email: 'brandon@upsidedowntalent.com',
    phone: null,
    full_name: 'Brandon Balfour',
    bio: '🇨🇦 Vancouver, BC\nbrandon@upsidedowntalent.com\n1.5M TikTok | 800k Youtube\n👇🏼Links to most recent post',
    category: 'Lifestyle',
    profile_image_url: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDYL6m5yO74YemwShEOZw8ll5KnwBNgPL3uS53ZNVF4TQXAsOvBSUK7qFqNzM%2BFQXu6GHFXWdQJ7%2FSYbgOKOsCn3Xt%2FYzeksBPYLUknr5ild2A%3D%3D',
    instagram_username: 'brandonbalfourr',
    instagram_followers: 852281,
    instagram_engagement_rate: 1.1,
    instagram_verified: true,
    tiktok_username: null,
    tiktok_followers: null,
    tiktok_engagement_rate: null,
    tiktok_verified: false,
    sponsored_posts_30d: 1,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inf-4',
    email: 'bryce@usehyve.com',
    phone: null,
    full_name: 'Bryce Witmer ✞',
    bio: 'atx | pa\nbuilding @usehyve\ntraining, health, building a brand\nDM me coach for 1:1 coaching',
    category: 'Health & Fitness',
    profile_image_url: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDY9F5GYbaeWl4lnJ0Tkae%2FaLehpzNllDPh27pIO7gH770oDUFiY3ACnIweGlh44jF68wwDvKQQ3vg7OSWgHSJ2pgNlJUwVYqIiahjW32e%2BqWA%3D%3D',
    instagram_username: 'bryce_witmer',
    instagram_followers: 83856,
    instagram_engagement_rate: 1.7,
    instagram_verified: false,
    tiktok_username: null,
    tiktok_followers: null,
    tiktok_engagement_rate: null,
    tiktok_verified: false,
    sponsored_posts_30d: 0,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inf-5',
    email: 'cole@menufit.app',
    phone: null,
    full_name: 'Cole Kosco',
    bio: 'Founder @menufit.app',
    category: 'Health & Fitness',
    profile_image_url: 'https://imgigp.modash.io/v2?mb0KwpL92uYofJiSjDn1%2F6peL1lBwv3s%2BUvShHERlDZ%2Fuc3eREMYRmlucP5lauWcXQjRijKh1Zi4z9%2F7WSNr2mcbXYXB2b84FbdjZyfGuAGAlExjVTya3d4MMAhCJdutWwq5%2BhsabX0Nc9aXCBbcsw%3D%3D',
    instagram_username: 'colekosco',
    instagram_followers: 257734,
    instagram_engagement_rate: 1.6,
    instagram_verified: true,
    tiktok_username: null,
    tiktok_followers: null,
    tiktok_engagement_rate: null,
    tiktok_verified: false,
    sponsored_posts_30d: 0,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inf-6',
    email: 'dylana@dylanasuarez.com',
    phone: null,
    full_name: 'Dylana Suarez',
    bio: 'Fashion, 📸✍️',
    category: 'Fashion & Beauty',
    profile_image_url: 'https://imgigp.modash.io/v2?qeKgYKgV1gO1vAP42sjOAmt8VZOFcFEb4OJcMrjtna85Tjn5vdMMzB0%2FEXicr%2BY5J7TeKh0ZEBR026e3SbZ2zlI1hu5l%2FBllGBWaUUBrUa5pzjGDtlInvUplh%2B%2BPx1qvjkxnQU968Rp9vwUAZ9M%2F5wg5wjaQPsN7lXz%2FNh%2BeaLQP7%2F319P2k%2F1dcITajqRah',
    instagram_username: null,
    instagram_followers: null,
    instagram_engagement_rate: null,
    instagram_verified: false,
    tiktok_username: 'dylanasuarez',
    tiktok_followers: 9999,
    tiktok_engagement_rate: 6.4,
    tiktok_verified: false,
    sponsored_posts_30d: 0,
    stripe_customer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Create mock orders with various statuses
const now = new Date();
const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
const twelveDaysAgo = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000);
const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

export const mockOrders: VouchOrder[] = [
  {
    id: 'order-1',
    brand_id: 'brand-1',
    influencer_id: 'inf-1',
    shopify_order_id: 'SHP-1001',
    order_total: 189.99,
    cogs: 76.00,
    sales_tax: 15.68,
    shipping_cost: 12.99,
    items_count: 3,
    currency: 'USD',
    platform: 'tiktok',
    status: 'post_pending',
    tracking_number: '1Z999AA10123456784',
    shipping_carrier: 'ups',
    estimated_delivery_at: null,
    delivered_at: hourAgo.toISOString(),
    post_deadline: new Date(hourAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: dayAgo.toISOString(),
    updated_at: hourAgo.toISOString(),
    influencer: mockInfluencers[0],
  },
  {
    id: 'order-2',
    brand_id: 'brand-1',
    influencer_id: 'inf-2',
    shopify_order_id: 'SHP-1002',
    order_total: 299.50,
    cogs: 119.80,
    sales_tax: 24.71,
    shipping_cost: 14.99,
    items_count: 5,
    currency: 'USD',
    platform: 'tiktok',
    status: 'post_verified',
    tracking_number: '1Z999AA10123456785',
    shipping_carrier: 'ups',
    estimated_delivery_at: null,
    delivered_at: twoDaysAgo.toISOString(),
    post_deadline: new Date(twoDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: twoDaysAgo.toISOString(),
    updated_at: dayAgo.toISOString(),
    influencer: mockInfluencers[1],
  },
  {
    id: 'order-3',
    brand_id: 'brand-1',
    influencer_id: 'inf-3',
    shopify_order_id: 'SHP-1003',
    order_total: 425.00,
    cogs: 170.00,
    sales_tax: 35.06,
    shipping_cost: 19.99,
    items_count: 7,
    currency: 'USD',
    platform: 'instagram',
    status: 'post_verified',
    tracking_number: '1Z999AA10123456786',
    shipping_carrier: 'ups',
    estimated_delivery_at: null,
    delivered_at: twelveDaysAgo.toISOString(),
    post_deadline: new Date(twelveDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: new Date(twelveDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(twelveDaysAgo.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[2],
  },
  {
    id: 'order-4',
    brand_id: 'brand-1',
    influencer_id: 'inf-1',
    shopify_order_id: 'SHP-1004',
    order_total: 149.00,
    cogs: 59.60,
    sales_tax: 12.29,
    shipping_cost: 9.99,
    items_count: 2,
    currency: 'USD',
    platform: 'tiktok',
    status: 'charged',
    tracking_number: '785612345678',
    shipping_carrier: 'fedex',
    estimated_delivery_at: null,
    delivered_at: tenDaysAgo.toISOString(),
    post_deadline: new Date(tenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: new Date(tenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    stripe_payment_intent_id: 'pi_mock123',
    created_at: twelveDaysAgo.toISOString(),
    updated_at: new Date(tenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[0],
  },
  {
    id: 'order-5',
    brand_id: 'brand-1',
    influencer_id: 'inf-2',
    shopify_order_id: 'SHP-1005',
    order_total: 89.99,
    cogs: 36.00,
    sales_tax: 7.42,
    shipping_cost: 6.99,
    items_count: 1,
    currency: 'USD',
    platform: 'tiktok',
    status: 'pending_delivery',
    tracking_number: null,
    shipping_carrier: null,
    estimated_delivery_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    delivered_at: null,
    post_deadline: null,
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: hourAgo.toISOString(),
    updated_at: hourAgo.toISOString(),
    influencer: mockInfluencers[1],
  },
  {
    id: 'order-6',
    brand_id: 'brand-1',
    influencer_id: 'inf-3',
    shopify_order_id: 'SHP-1006',
    order_total: 275.00,
    cogs: 110.00,
    sales_tax: 22.69,
    shipping_cost: 12.99,
    items_count: 4,
    currency: 'USD',
    platform: 'instagram',
    status: 'charged',
    tracking_number: '420123459400111899223033005012',
    shipping_carrier: 'usps',
    estimated_delivery_at: null,
    delivered_at: fifteenDaysAgo.toISOString(),
    post_deadline: new Date(fifteenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: new Date(fifteenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    stripe_payment_intent_id: 'pi_mock456',
    created_at: new Date(fifteenDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(fifteenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[2],
  },
  {
    id: 'order-7',
    brand_id: 'brand-1',
    influencer_id: 'inf-4',
    shopify_order_id: 'SHP-1007',
    order_total: 215.00,
    cogs: 86.00,
    sales_tax: 17.74,
    shipping_cost: 11.99,
    items_count: 3,
    currency: 'USD',
    platform: 'instagram',
    status: 'post_verified',
    tracking_number: '1Z999AA10123456787',
    shipping_carrier: 'ups',
    estimated_delivery_at: null,
    delivered_at: tenDaysAgo.toISOString(),
    post_deadline: new Date(tenDaysAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: new Date(tenDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(tenDaysAgo.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[3],
  },
  {
    id: 'order-8',
    brand_id: 'brand-1',
    influencer_id: 'inf-5',
    shopify_order_id: 'SHP-1008',
    order_total: 350.00,
    cogs: 140.00,
    sales_tax: 28.88,
    shipping_cost: 14.99,
    items_count: 4,
    currency: 'USD',
    platform: 'instagram',
    status: 'post_pending',
    tracking_number: '785612345679',
    shipping_carrier: 'fedex',
    estimated_delivery_at: null,
    delivered_at: dayAgo.toISOString(),
    post_deadline: new Date(dayAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: twoDaysAgo.toISOString(),
    updated_at: dayAgo.toISOString(),
    influencer: mockInfluencers[4],
  },
  {
    id: 'order-9',
    brand_id: 'brand-1',
    influencer_id: 'inf-6',
    shopify_order_id: 'SHP-1009',
    order_total: 175.00,
    cogs: 70.00,
    sales_tax: 14.44,
    shipping_cost: 9.99,
    items_count: 2,
    currency: 'USD',
    platform: 'tiktok',
    status: 'delivered',
    tracking_number: '420123459400111899223033005013',
    shipping_carrier: 'usps',
    estimated_delivery_at: null,
    delivered_at: hourAgo.toISOString(),
    post_deadline: new Date(hourAgo.getTime() + 72 * 60 * 60 * 1000).toISOString(),
    charged_at: null,
    stripe_payment_intent_id: null,
    created_at: dayAgo.toISOString(),
    updated_at: hourAgo.toISOString(),
    influencer: mockInfluencers[5],
  },
];

// Posts should be detected within 72 hours (3 days) of delivery
export const mockPosts: VouchPost[] = [
  {
    id: 'post-1',
    order_id: 'order-2',
    influencer_id: 'inf-2',
    brand_id: 'brand-1',
    platform: 'tiktok',
    post_url: 'https://tiktok.com/@dotcomliam/video/123456',
    post_id: 'tiktok123',
    likes: 1850,
    comments: 52,
    views: 18500,
    engagement_rate: 10.2,
    boosting_rights_granted: true,
    detected_at: new Date(twoDaysAgo.getTime() + 18 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(twoDaysAgo.getTime() + 18 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[1],
  },
  {
    id: 'post-2',
    order_id: 'order-3',
    influencer_id: 'inf-3',
    brand_id: 'brand-1',
    platform: 'instagram',
    post_url: 'https://instagram.com/p/def456',
    post_id: 'def456',
    likes: 9200,
    comments: 218,
    views: 72000,
    engagement_rate: 12.1,
    boosting_rights_granted: false,
    detected_at: new Date(twelveDaysAgo.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(twelveDaysAgo.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[2],
  },
  {
    id: 'post-3',
    order_id: 'order-7',
    influencer_id: 'inf-4',
    brand_id: 'brand-1',
    platform: 'instagram',
    post_url: 'https://instagram.com/p/ghi789',
    post_id: 'ghi789',
    likes: 7500,
    comments: 185,
    views: 62000,
    engagement_rate: 11.5,
    boosting_rights_granted: true,
    detected_at: new Date(tenDaysAgo.getTime() + 36 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(tenDaysAgo.getTime() + 36 * 60 * 60 * 1000).toISOString(),
    influencer: mockInfluencers[3],
  },
];

// Mock product data for popular items
export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image_url: string | null;
  shopify_product_id?: string;
}

export interface OrderWithItems extends VouchOrder {
  items?: OrderItem[];
}

export const mockOrderItems: Record<string, OrderItem[]> = {
  'order-1': [
    { id: 'item-1a', name: 'Silk Blend Midi Dress', sku: 'SBMD-001', price: 89.99, quantity: 1, image_url: null, shopify_product_id: '7654321098765' },
    { id: 'item-1b', name: 'Leather Crossbody Bag', sku: 'LCB-042', price: 65.00, quantity: 1, image_url: null, shopify_product_id: '7654321098766' },
    { id: 'item-1c', name: 'Gold Hoop Earrings', sku: 'GHE-015', price: 35.00, quantity: 1, image_url: null, shopify_product_id: '7654321098767' },
  ],
  'order-2': [
    { id: 'item-2a', name: 'Cashmere Sweater', sku: 'CSW-023', price: 129.00, quantity: 1, image_url: null, shopify_product_id: '7654321098768' },
    { id: 'item-2b', name: 'Silk Blend Midi Dress', sku: 'SBMD-001', price: 89.99, quantity: 1, image_url: null, shopify_product_id: '7654321098765' },
    { id: 'item-2c', name: 'Vintage Sunglasses', sku: 'VSG-008', price: 45.00, quantity: 1, image_url: null, shopify_product_id: '7654321098769' },
    { id: 'item-2d', name: 'Leather Belt', sku: 'LB-019', price: 35.51, quantity: 2, image_url: null, shopify_product_id: '7654321098770' },
  ],
  'order-3': [
    { id: 'item-3a', name: 'Cashmere Sweater', sku: 'CSW-023', price: 129.00, quantity: 2, image_url: null, shopify_product_id: '7654321098768' },
    { id: 'item-3b', name: 'Silk Blend Midi Dress', sku: 'SBMD-001', price: 89.99, quantity: 2, image_url: null, shopify_product_id: '7654321098765' },
    { id: 'item-3c', name: 'Gold Hoop Earrings', sku: 'GHE-015', price: 35.00, quantity: 1, image_url: null, shopify_product_id: '7654321098767' },
  ],
  'order-4': [
    { id: 'item-4a', name: 'Yoga Mat Premium', sku: 'YMP-001', price: 79.00, quantity: 1, image_url: null, shopify_product_id: '7654321098771' },
    { id: 'item-4b', name: 'Resistance Band Set', sku: 'RBS-005', price: 70.00, quantity: 1, image_url: null, shopify_product_id: '7654321098772' },
  ],
  'order-5': [
    { id: 'item-5a', name: 'Gold Hoop Earrings', sku: 'GHE-015', price: 89.99, quantity: 1, image_url: null, shopify_product_id: '7654321098767' },
  ],
  'order-6': [
    { id: 'item-6a', name: 'Cashmere Sweater', sku: 'CSW-023', price: 129.00, quantity: 1, image_url: null, shopify_product_id: '7654321098768' },
    { id: 'item-6b', name: 'Leather Belt', sku: 'LB-019', price: 35.00, quantity: 1, image_url: null, shopify_product_id: '7654321098770' },
    { id: 'item-6c', name: 'Silk Scarf', sku: 'SS-033', price: 55.00, quantity: 2, image_url: null, shopify_product_id: '7654321098773' },
  ],
  'order-7': [
    { id: 'item-7a', name: 'Cashmere Sweater', sku: 'CSW-023', price: 129.00, quantity: 1, image_url: null, shopify_product_id: '7654321098768' },
    { id: 'item-7b', name: 'Vintage Sunglasses', sku: 'VSG-008', price: 45.00, quantity: 1, image_url: null, shopify_product_id: '7654321098769' },
    { id: 'item-7c', name: 'Leather Belt', sku: 'LB-019', price: 41.00, quantity: 1, image_url: null, shopify_product_id: '7654321098770' },
  ],
  'order-8': [
    { id: 'item-8a', name: 'Silk Blend Midi Dress', sku: 'SBMD-001', price: 89.99, quantity: 2, image_url: null, shopify_product_id: '7654321098765' },
    { id: 'item-8b', name: 'Gold Hoop Earrings', sku: 'GHE-015', price: 35.00, quantity: 2, image_url: null, shopify_product_id: '7654321098767' },
  ],
  'order-9': [
    { id: 'item-9a', name: 'Leather Crossbody Bag', sku: 'LCB-042', price: 65.00, quantity: 1, image_url: null, shopify_product_id: '7654321098766' },
    { id: 'item-9b', name: 'Silk Scarf', sku: 'SS-033', price: 55.00, quantity: 2, image_url: null, shopify_product_id: '7654321098773' },
  ],
};

// Get top products by order frequency
export function getTopProducts(orders: VouchOrder[], limit: number = 3) {
  const productCounts: Record<string, { name: string; sku: string; count: number; totalValue: number; shopifyProductId?: string }> = {};
  
  orders.forEach(order => {
    const items = mockOrderItems[order.id] || [];
    items.forEach(item => {
      if (!productCounts[item.sku]) {
        productCounts[item.sku] = { name: item.name, sku: item.sku, count: 0, totalValue: 0, shopifyProductId: item.shopify_product_id };
      }
      productCounts[item.sku].count += item.quantity;
      productCounts[item.sku].totalValue += item.price * item.quantity;
    });
  });
  
  return Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Helper to get stats
export function getOrderStats() {
  const total = mockOrders.length;
  const pending = mockOrders.filter(o => o.status === 'pending_delivery').length;
  const creatingContent = mockOrders.filter(o => o.status === 'post_pending').length;
  const verified = mockOrders.filter(o => o.status === 'post_verified').length;
  const charged = mockOrders.filter(o => o.status === 'charged').length;
  
  const totalValue = mockOrders.reduce((sum, o) => sum + o.order_total, 0);
  const chargedValue = mockOrders
    .filter(o => o.status === 'charged')
    .reduce((sum, o) => sum + o.order_total, 0);
  const savedValue = mockOrders
    .filter(o => o.status === 'post_verified')
    .reduce((sum, o) => sum + o.order_total, 0);

  return {
    total,
    pending,
    creatingContent,
    verified,
    charged,
    totalValue,
    chargedValue,
    savedValue,
  };
}
