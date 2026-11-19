// SAMPLE DATA for the demo's merchant dashboard. Copied from Vouch-MVP-Production's design preview
// (src/preview/sampleData.ts, henry/creator-profile-cache, November 2026) and re-pointed at the demo's
// fictional store, Harbor & Pine. Every person, handle and number here is invented; the dashboard
// shows a permanent "Sample data" label.
import type { Brand, VouchPost, Profile } from '@dashboard/types/vouch';
import { MERCHANT_TERMS } from '@dashboard/lib/legalDocuments';
import { discountForFollowers, settingsFromBrand } from '@dashboard/lib/postToPaySettings';
import { DEFAULT_BRAND_MESSAGING } from '@dashboard/lib/brandMessaging';
import type { CheckoutAgreementLine, CheckoutDashboardRow, CheckoutTransaction } from '@dashboard/types/checkout';

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * DAY).toISOString();

export const SAMPLE_BRAND_ID = 'preview-brand';
export const SAMPLE_USER_ID = 'preview-user';

export function sampleBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: SAMPLE_BRAND_ID,
    name: 'Harbor & Pine',
    slug: 'harbor-and-pine',
    contact_email: 'jordan@harborandpine.example',
    logo_url: null,
    instagram_username: 'harborandpine',
    tiktok_username: null,
    min_followers: 2500,
    discount_at_min_percent: 10,
    full_discount_followers: 10000,
    floor_discount_percent: null,
    max_discount_amount: null,
    combine_with_other_discounts: false,
    accepting_orders: true,
    button_pages: ['product', 'cart'],
    button_color: '#4A54E2',
    button_text: 'white',
    button_corners: 'theme',
    button_radius: null,
    button_size: 'standard',
    min_engagement_rate: 0,
    free_express_shipping: true,
    posting_window_days: 3,
    delivery_days: null,
    max_uses_per_customer: 1,
    uses_period: 'month',
    // New brands get Vouch's defaults from the database.
    ...DEFAULT_BRAND_MESSAGING,
    max_sponsored_posts_30d: 10,
    settings_completed_at: daysAgo(40),
    terms_accepted_at: daysAgo(40),
    terms_accepted_version: MERCHANT_TERMS.version,
    created_at: daysAgo(41),
    updated_at: daysAgo(40),
    ...overrides,
  };
}

export function sampleProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: SAMPLE_USER_ID,
    email: 'jordan@harborandpine.example',
    full_name: 'Jordan Rivera',
    job_title: 'Founder',
    avatar_url: null,
    brand_id: SAMPLE_BRAND_ID,
    brand_role: 'owner',
    created_at: daysAgo(41),
    updated_at: daysAgo(41),
    ...overrides,
  };
}

// Instagram creators: Post to Pay checks the shopper's Instagram account.
type CreatorSeed = [name: string, handle: string, followers: number, engagement: number];

const CREATORS: CreatorSeed[] = [
  ['Ava Thompson', 'ava.bakes', 84_200, 4.1],
  ['Noah Kim', 'noahkim.eats', 12_900, 6.3],
  ['Priya Raman', 'priya.at.home', 31_400, 3.2],
  ['Diego Morales', 'diegomoves', 9_700, 5.8],
  ['Lena Fischer', 'lenafischer', 4_300, 7.9],
  ['Sam Okafor', 'sam.okafor', 56_800, 2.7],
  ['Maya Chen', 'mayacooks', 18_600, 4.8],
  ['Eli Brooks', 'elibrooks', 2_900, 9.1],
  ['Zoe Martin', 'zoe.travels', 142_000, 1.9],
  ['Omar Haddad', 'omarhaddad', 6_100, 5.2],
  // More creators across every follower range, so analytics has something to compare.
  ['Grace Liu', 'gracebakesdaily', 3_400, 8.2],
  ['Marcus Bell', 'marcusmakes', 7_800, 6.1],
  ['Hana Sato', 'hana.sweets', 22_500, 4.4],
  ['Leo Grant', 'leogrant.fit', 41_000, 3.1],
  ['Isla Moreno', 'isla.eats', 2_700, 9.4],
  ['Ben Carter', 'bencarter', 95_000, 2.2],
  ['Nia Brooks', 'nia.home', 12_300, 5.0],
  ['Theo Nguyen', 'theocooks', 4_800, 7.3],
  ['Ruby Hall', 'rubyhall', 67_000, 2.6],
  ['Kai Patel', 'kaipatel', 9_200, 5.9],
];

// Placeholder "photos" for the preview: a plain silhouette on a tint, plainly not a real person. Every third
// creator has none, so the initial fallback stays visible too.
const TINTS = ['#C7CBF5', '#F5D9C7', '#C7EBDD', '#EBC7DA', '#E6E2C3'];
export function samplePhoto(i: number): string | null {
  if (i % 3 === 2) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${TINTS[i % TINTS.length]}"/>`
    + '<circle cx="32" cy="25" r="11" fill="#fff" fill-opacity=".85"/><path d="M12 64c2-14 10-21 20-21s18 7 20 21z" fill="#fff" fill-opacity=".85"/></svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Stage = 'placed' | 'in_transit' | 'awaiting_post' | 'post_found' | 'posted' | 'charged';
type OrderSeed = [creator: number, placedDaysAgo: number, stage: Stage];

// Post to Pay orders across every stage, so each badge and timeline state is visible. A found post that
// isn't settled yet (post_found) still shows as Posted. Every sample gift is a
// Post to Pay order with its products, as every real order is (owner decision, October 24).
const ORDERS: OrderSeed[] = [
  [0, 1, 'placed'],
  [1, 2, 'in_transit'],
  [2, 4, 'awaiting_post'],
  [3, 5, 'awaiting_post'],
  [4, 6, 'awaiting_post'],
  [5, 9, 'post_found'],
  [6, 12, 'post_found'],
  [7, 14, 'charged'],
  [8, 17, 'posted'],
  [0, 21, 'posted'],
  [9, 24, 'posted'],
  [2, 28, 'posted'],
  [6, 33, 'charged'],
  [1, 38, 'posted'],
  // Older gifts, all finished, spread over the previous three months.
  ...Array.from({ length: 30 }, (_, i): OrderSeed => {
    const creator = (i * 7 + 3) % 20;
    // Roughly four in five creators post; the rest are charged.
    return [creator, Math.round(40 + i * 2.5), i % 5 === 3 ? 'charged' : 'posted'];
  }),
];

// The sample brand's catalog: each order takes one to three of these.
const PRODUCTS: CheckoutAgreementLine[] = [
  { title: 'Everyday Bottle', variantTitle: 'Slate', quantity: 1, lineSubtotalCents: 4200 },
  { title: 'Carry Sling', variantTitle: 'Sand', quantity: 1, lineSubtotalCents: 2400 },
  { title: 'Insulated Lid', variantTitle: 'Steel', quantity: 1, lineSubtotalCents: 1800 },
  { title: 'Bottle Brush Kit', variantTitle: 'Natural', quantity: 1, lineSubtotalCents: 1200 },
  { title: 'Travel Tumbler', variantTitle: 'Pine', quantity: 1, lineSubtotalCents: 3600 },
  { title: 'Straw Cap', variantTitle: 'Sage', quantity: 1, lineSubtotalCents: 1600 },
];
function orderLines(i: number): CheckoutAgreementLine[] {
  const count = 1 + (i % 3);
  return Array.from({ length: count }, (_, k) => {
    const product = PRODUCTS[(i * 5 + k * 2) % PRODUCTS.length];
    const quantity = k === 0 && i % 4 === 1 ? 2 : 1;
    return { ...product, quantity, lineSubtotalCents: product.lineSubtotalCents * quantity };
  });
}

// Niches as Modash names its interests (its creator report); Modash gives none for every fourth creator.
const CATEGORIES = ['Restaurants, Food & Grocery', 'Coffee, Tea & Beverages', 'Fitness & Yoga', 'Home Decor, Furniture & Garden', 'Clothes, Shoes, Handbags & Accessories', 'Travel, Tourism & Aviation'];
const sampleCategory = (creator: number) => creator % 4 === 3 ? null : CATEGORIES[creator % CATEGORIES.length];

/** The sample Post to Pay orders, shaped like the vouch-checkout "transactions" action's rows. */
function seededTransactions(): CheckoutDashboardRow[] {
  const settings = settingsFromBrand(sampleBrand());
  return ORDERS.map(([creator, placed, stage], i) => {
    const [name, handle, followers, engagement] = CREATORS[creator];
    const lines = orderLines(i);
    const products = lines.reduce((sum, line) => sum + line.lineSubtotalCents, 0);
    const discount = discountForFollowers(settings, followers) ?? 0;
    const agreement = cartAgreement(lines, 100 - discount);
    const deposit = agreement.depositCents!, balance = agreement.balanceCents!;
    const n = 1250 - i;
    const delivered = stage === 'placed' || stage === 'in_transit' ? null
      : stage === 'awaiting_post' ? daysAgo(3 - (i % 2) - 1) : daysAgo(placed - 3);
    const deadline = delivered ? new Date(Date.parse(delivered) + 3 * DAY).toISOString() : null;
    const finished = stage === 'posted' || stage === 'charged';
    const row = cartRow({ n, username: handle, name, placed, photo: samplePhoto(creator), followers, engagement, category: sampleCategory(creator), transaction: {
      agreement,
      payment: payment(`#${n}`, finished
        ? (stage === 'posted' ? { totalCents: deposit, paidCents: deposit } : { totalCents: products, paidCents: products })
        : { totalCents: products, paidCents: deposit, outstandingCents: balance, authorizedCents: balance, dueAt: daysAhead(10) }),
      delivery: { deliveredAt: delivered }, postingDeadlineAt: deadline,
      servicing: { state: finished ? 'ended' : stage === 'placed' ? 'awaiting_fulfillment' : delivered ? 'posting_window_open' : 'awaiting_delivery',
        fulfillment: stage === 'placed' ? 'held' : 'shipped', schedule: 'aligned',
        tracking: stage === 'placed' ? null : { number: `9400 1000 0000 0000 0${n}`, company: 'USPS', url: null } },
      postDetectedAt: stage === 'post_found' || stage === 'posted' ? new Date(Date.parse(delivered!) + 2 * DAY).toISOString() : null,
      decision: finished ? { kind: stage === 'posted' ? 'approved' : 'missed', recordedAt: daysAgo(placed - 6) } : null,
      outcome: stage === 'posted' ? 'waived' : stage === 'charged' ? 'collected' : null,
      outcomeObservedAt: finished ? daysAgo(placed - 7) : null,
    } });
    return row;
  });
}

/** Every sample Post to Pay order: the stage samples plus the six whole-cart cases. */
export function sampleTransactions(): CheckoutDashboardRow[] {
  return [...seededTransactions(), ...sampleCartTransactions()];
}

/** Posts for the orders whose post was found, tied to the order as real posts are (checkout_offer_id). */
export function samplePosts(): VouchPost[] {
  return sampleTransactions()
    .filter(row => row.transaction.postDetectedAt && row.transaction.outcome !== 'collected')
    .map((row, i) => {
      const followers = row.profile.followers ?? 5_000;
      // Smaller accounts tend to reach a larger share of their followers.
      const reach = followers < 5_000 ? 0.9 : followers < 10_000 ? 0.7 : followers < 50_000 ? 0.45 : 0.25;
      const views = Math.round(followers * reach * (0.8 + (i % 4) * 0.12));
      const likes = Math.round(views * (0.03 + (i % 5) * 0.012));
      const comments = Math.round(likes * 0.08);
      return {
        id: `preview-post-${i + 1}`,
        brand_id: SAMPLE_BRAND_ID,
        order_id: row.id,
        checkout_offer_id: row.id,
        influencer_id: `instagram:${row.username}`,
        platform: 'instagram',
        post_id: null,
        post_url: 'https://www.instagram.com/',
        views,
        likes,
        comments,
        engagement_rate: Math.round(((likes + comments) / views) * 1000) / 10,
        boosting_rights_granted: i % 3 !== 2,
        detected_at: row.transaction.postDetectedAt!,
        created_at: row.createdAt,
        // The newest post cleared Vouch's review two hours ago, so the brand's 24-hour flag window is open.
        ...(i === 0 ? { review_status: 'released', reviewed_at: daysAgo(2 / 24) } : {}),
      } as VouchPost;
    });
}

export const SAMPLE_MEMBERS = [
  { user_id: SAMPLE_USER_ID, email: 'jordan@harborandpine.example', full_name: 'Jordan Rivera', brand_role: 'owner', joined_at: daysAgo(41) },
  { user_id: 'preview-user-2', email: 'alex@example.com', full_name: 'Alex Park', brand_role: 'admin', joined_at: daysAgo(30) },
  { user_id: 'preview-user-3', email: 'casey@example.com', full_name: 'Casey Lee', brand_role: 'viewer', joined_at: daysAgo(12) },
];

// Whole-cart Post to Pay cases (October 14 states), shaped like the vouch-checkout "transactions" action's
// rows (src/types/checkout.ts), so each state of the order panel can be reviewed on Gifts.
const daysAhead = (days: number) => daysAgo(-days);
const CART_LINES: CheckoutAgreementLine[] = [
  { title: 'Insulated Lid', variantTitle: 'Steel', quantity: 2, lineSubtotalCents: 3600 },
  { title: 'Everyday Bottle', variantTitle: 'Sage', quantity: 1, lineSubtotalCents: 4400 },
];
// 60% paid today on the Post to Pay items unless a plan step is given; the whole-cart cases' 8% sample tax
// is deferred with the balance.
function cartAgreement(lines = CART_LINES, payNowPercent = 60): CheckoutTransaction['agreement'] {
  const products = lines.reduce((sum, line) => sum + line.lineSubtotalCents, 0);
  const deposit = Math.round(products * payNowPercent / 100);
  return { version: 'cart-v1', lines, productSubtotalCents: products, depositCents: deposit, balanceCents: products - deposit,
    currency: 'USD', termsVersion: 'sample-only', terms: 'Sample agreement (demo data).',
    postingRequirements: 'Sample posting requirements.', servicing: { postingWindowDays: 3 } };
}
type CartSample = { n: number; username: string; name: string; placed: number; transaction: Partial<CheckoutTransaction>;
  photo?: string | null; followers?: number; engagement?: number; category?: string | null };
function cartRow({ n, username, name, placed, transaction, photo, followers = 8200, engagement = 3.4, category = null }: CartSample): CheckoutDashboardRow {
  const id = `00000000-0000-4000-8000-00000000${n}`;
  return { id, brandId: SAMPLE_BRAND_ID, username, shopDomain: 'harbor-and-pine.myshopify.com', createdAt: daysAgo(placed),
    profile: { displayName: name, followers, engagement, photo: photo === undefined ? samplePhoto(n) : photo, category },
    transaction: { version: 1, id, state: 'confirmed', orderId: `gid://shopify/Order/${n}`, acceptedAt: daysAgo(placed),
      reconciledAt: daysAgo(Math.max(placed - 1, 0.1)), agreement: cartAgreement(), consent: { accepted: true }, payment: null,
      delivery: { deliveredAt: null }, postingDeadlineAt: null, servicing: null, postDetectedAt: null,
      outcome: null, outcomeObservedAt: null, decision: null, settlement: null, ...transaction } };
}
type Payment = NonNullable<CheckoutTransaction['payment']>;
const payment = (orderName: string, values: Partial<Payment>): Payment => ({ verified: true, reasons: [], orderName, currency: 'USD',
  totalCents: 0, paidCents: 0, outstandingCents: 0, authorizedCents: 0, dueAt: null, ...values });

export function sampleCartTransactions(): CheckoutDashboardRow[] {
  // Two mugs and a tote ($80.00): $48.00 paid today, $32.00 balance plus $6.40 tax deferred.
  // The ordinary candle is $18.00 plus $1.44 tax; shipping is $7.50 plus $0.60 tax.
  const deferred = 3200 + 640;
  const candle = 1944;
  return [
    cartRow({ n: 1031, username: 'june.outdoors', name: 'June Alvarez', placed: 5, transaction: {
      payment: payment('#1031', { totalCents: 8000 + 640 + candle, paidCents: 4800 + candle, outstandingCents: deferred,
        authorizedCents: deferred, otherItemsCents: candle, dueAt: daysAhead(2) }),
      delivery: { deliveredAt: daysAgo(1) }, postingDeadlineAt: daysAhead(2),
      servicing: { state: 'posting_window_open', fulfillment: 'shipped', schedule: 'aligned', authorization: { state: 'confirmed', expiresAt: daysAhead(4) } } } }),
    cartRow({ n: 1032, username: 'rowan.rides', name: 'Rowan Price', placed: 2, transaction: {
      payment: payment('#1032', { totalCents: 8000 + 640 + candle + 810, paidCents: 4800 + candle + 810, outstandingCents: deferred,
        authorizedCents: deferred, otherItemsCents: candle, shippingCents: 750, shippingTaxCents: 60, dueAt: daysAhead(10) }),
      servicing: { state: 'awaiting_delivery', fulfillment: 'shipped', schedule: 'aligned', authorization: { state: 'confirmed', expiresAt: daysAhead(5) } } } }),
    // Approved posts whose order Shopify's tax rounding left a few cents below what was paid: refunded, then not yet.
    cartRow({ n: 1033, username: 'tess.hikes', name: 'Tess Walker', placed: 12, transaction: {
      payment: payment('#1033', { totalCents: 4798, paidCents: 4800, roundingRefundCents: 2, roundingRefundDueCents: 0 }),
      delivery: { deliveredAt: daysAgo(8) }, postingDeadlineAt: daysAgo(5), postDetectedAt: daysAgo(7),
      servicing: { state: 'ended', fulfillment: 'shipped', schedule: 'aligned' },
      decision: { kind: 'approved', recordedAt: daysAgo(6) }, outcome: 'waived', outcomeObservedAt: daysAgo(5.9) } }),
    cartRow({ n: 1034, username: 'mika.daily', name: 'Mika Torres', placed: 9, transaction: {
      payment: payment('#1034', { totalCents: 4797, paidCents: 4800, roundingRefundCents: 3, roundingRefundDueCents: 3 }),
      delivery: { deliveredAt: daysAgo(6) }, postingDeadlineAt: daysAgo(3), postDetectedAt: daysAgo(5),
      servicing: { state: 'post_detected', fulfillment: 'shipped', schedule: 'aligned' },
      decision: { kind: 'approved', recordedAt: daysAgo(4) } } }),
    // The shopper took one mug out before checkout, so the order was priced from the $56.00 bought.
    cartRow({ n: 1035, username: 'felix.kayaks', name: 'Felix Ward', placed: 3, transaction: {
      agreement: cartAgreement([{ ...CART_LINES[0], quantity: 1, lineSubtotalCents: 2400 }, CART_LINES[1]]),
      payment: payment('#1035', { totalCents: 5600 + 448, paidCents: 3360, outstandingCents: 2240 + 448, authorizedCents: 2240 + 448, dueAt: daysAhead(12) }),
      repricedAtOrder: { at: daysAgo(3), savingCents: 1600 },
      servicing: { state: 'awaiting_delivery', fulfillment: 'shipped', schedule: 'aligned', authorization: { state: 'confirmed', expiresAt: daysAhead(4) } } } }),
    // Every card hold retry was declined before shipment, so Vouch canceled and refunded the order.
    cartRow({ n: 1036, username: 'anya.trails', name: 'Anya Reed', placed: 1.5, transaction: {
      payment: payment('#1036', { totalCents: 8000 + 640, paidCents: 4800, outstandingCents: deferred, dueAt: daysAhead(14) }),
      servicing: { state: 'cancel_requested', fulfillment: 'held', schedule: 'aligned', authorization: { state: 'declined' },
        message: 'The card hold was declined 3 times, so Vouch canceled and refunded the order in Shopify; waiting for Shopify to confirm.' },
      cancellation: { requestedAt: daysAgo(0.5), source: 'vouch', by: null, reason: 'Card declined' } } }),
  ];
}
