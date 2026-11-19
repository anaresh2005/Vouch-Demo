// App-facing type aliases. DB-backed types re-export the auto-generated
// Database types from src/integrations/supabase/types.ts so they can never
// drift from the live schema. Regenerate types.ts whenever the DB changes.

import type { Database } from '@dashboard/integrations/supabase/types';

// ── Enums ──────────────────────────────────────────────────────────────────

export type VouchOrderStatus = Database['public']['Enums']['vouch_order_status'];

// ── Table row types ────────────────────────────────────────────────────────
export type Brand = Database['public']['Tables']['brands']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Influencer = Database['public']['Tables']['influencers']['Row'];

// VouchOrder/VouchPost queries often embed related rows via PostgREST joins
// (e.g. `.select('*, influencer:influencers(*)')`). The Row type alone doesn't
// model those, so we extend with optional relation fields.
type VouchOrderRow = Database['public']['Tables']['vouch_orders']['Row'];
export type VouchOrder = VouchOrderRow & {
  transaction?: import('./checkout').CheckoutTransaction;
  shopDomain?: string;
  legacyOrderIds?: string[];
  influencer?: Influencer | null;
  brand?: Brand | null;
  /**
   * Product price paid after the discount (excluding tax/shipping). Not stored on legacy orders. Until then it is absent, and
   * anything that needs it (Paid, CPM) shows as unavailable.
   */
  paid_total?: number | null;
  /** Undiscounted product subtotal. Legacy Shopify total_price is not this amount.
   * These product-level amounts are currently supplied only by explicit preview/test fixtures.
   * Do not fill them from the order-level transaction payment totals.
   */
  retail_total?: number | null;
};

type VouchPostRow = Database['public']['Tables']['vouch_posts']['Row'];
export type VouchPost = Omit<VouchPostRow, 'order_id' | 'checkout_offer_id'> & {
  order_id: string;
  checkout_offer_id?: string | null;
  // Vouch's post review and flags (20261008100000, 20261009120100); not in the generated types yet.
  review_status?: 'pending' | 'released' | 'cancelled';
  review_release_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by_email?: string | null;
  flag?: 'fix' | 'content' | null;
  fix_by?: string | null;
  flag_source?: 'vouch' | 'merchant' | null;
  // The brand's flag, waiting for or resolved by Vouch staff (20261024110000).
  flag_request?: 'profanity' | 'content' | null;
  flag_requested_at?: string | null;
  flag_requested_by_email?: string | null;
  flag_request_resolution?: 'confirmed' | 'dismissed' | null;
  influencer?: Influencer | null;
  order?: VouchOrder | null;
};

// ── App-only types (not stored in the DB) ──────────────────────────────────

// The DB stores `influencers.category` as plain text, but the frontend
// constrains the filter UI to this fixed list. Promote to a DB enum later
// if the set stops changing.
export type InfluencerCategory =
  | 'Fashion & Beauty'
  | 'Health & Fitness'
  | 'Food & Cooking'
  | 'Travel & Adventure'
  | 'Tech & Gaming'
  | 'Lifestyle'
  | 'Home & Decor'
  | 'Parenting & Family';

// Checkout-related types
