// The situations the design preview can start in. Each one seeds the in-browser stand-in
// database, so every screen and state can be opened directly from the /preview index.
import type { Brand, Influencer, Profile, VouchOrder, VouchPost } from '@dashboard/types/vouch';
import type { CheckoutDashboardRow } from '@dashboard/types/checkout';
import {
  SAMPLE_MEMBERS, SAMPLE_USER_ID, sampleBrand, samplePosts, sampleProfile, sampleTransactions,
} from './sampleData';

export type ShopifyState = 'not_connected' | 'connected' | 'needs_reconnect';
export type DataMode = 'ready' | 'loading' | 'error';

export type PreviewUser = { id: string; email: string; user_metadata: Record<string, string | undefined> };

export type PreviewState = {
  scenario: string;
  user: PreviewUser | null;
  pendingInvite: string | null;
  shopify: ShopifyState;
  dataMode: DataMode;
  tables: {
    profiles: Profile[];
    brands: Brand[];
    vouch_orders: VouchOrder[];
    vouch_posts: VouchPost[];
    influencers: Influencer[];
    legal_acceptances: Record<string, unknown>[];
    brand_invites: Record<string, unknown>[];
    vouch_post_reports: Record<string, unknown>[];
  };
  members: typeof SAMPLE_MEMBERS;
  // The sample Post to Pay orders the vouch-checkout "transactions" action serves.
  transactions?: CheckoutDashboardRow[];
};

export type Scenario = {
  id: string;
  group: 'Sign in' | 'Onboarding' | 'Dashboard';
  label: string;
  description: string;
  path: string;
  build: () => PreviewState;
};

const OWNER: PreviewUser = { id: SAMPLE_USER_ID, email: 'jordan@harborandpine.example', user_metadata: { full_name: 'Jordan Rivera', job_title: 'Founder' } };

function base(scenario: string): PreviewState {
  return {
    scenario,
    user: null,
    pendingInvite: null,
    shopify: 'connected',
    dataMode: 'ready',
    tables: { profiles: [], brands: [], vouch_orders: [], vouch_posts: [], influencers: [], legal_acceptances: [], brand_invites: [], vouch_post_reports: [] },
    members: SAMPLE_MEMBERS,
  };
}

function signedIn(scenario: string, brand: Partial<Brand> | null, extra: Partial<PreviewState> = {}, profile: Partial<Profile> = {}): PreviewState {
  const state = base(scenario);
  state.user = profile.id ? { id: profile.id, email: profile.email ?? OWNER.email, user_metadata: { full_name: profile.full_name ?? undefined } } : OWNER;
  state.tables.profiles = [sampleProfile(brand ? profile : { brand_id: null, brand_role: null, ...profile })];
  if (brand) state.tables.brands = [sampleBrand(brand)];
  return { ...state, ...extra };
}

// Every sample gift is a Post to Pay order (owner decision, October 24); none comes from the older gifting table.
function withSampleData(state: PreviewState): PreviewState {
  state.transactions = sampleTransactions();
  state.tables.vouch_posts = samplePosts();
  return state;
}

// Counted from the sample data so the preview index stays accurate when the samples change.
const sampleCounts = { orders: sampleTransactions().length, posts: samplePosts().length,
  creators: new Set(sampleTransactions().map(row => row.username)).size };

const notSetUp: Partial<Brand> = { settings_completed_at: null, terms_accepted_at: null, terms_accepted_version: null };

export const SCENARIOS: Scenario[] = [
  {
    id: 'signed-out', group: 'Sign in', label: 'Log in', path: '/',
    description: 'Signed out. Any email and password logs in to the sample dashboard.',
    build: () => base('signed-out'),
  },
  {
    id: 'sign-up', group: 'Sign in', label: 'Sign up', path: '/signup',
    description: 'Signed out, on the sign-up tab. Signing up walks through onboarding as a new brand.',
    build: () => base('sign-up'),
  },
  {
    id: 'invited', group: 'Sign in', label: 'Sign up from a team invite', path: '/signup',
    description: 'Opened from a team invite link, so the brand name field is hidden.',
    build: () => ({ ...base('invited'), pendingInvite: 'preview-invite' }),
  },
  {
    id: 'forgot-password', group: 'Sign in', label: 'Forgot password', path: '/forgot-password',
    description: 'Asks for an email and confirms a reset link was sent. No email is sent in the preview.',
    build: () => base('forgot-password'),
  },
  {
    id: 'reset-password', group: 'Sign in', label: 'Reset password', path: '/reset-password',
    description: 'Where the reset email leads: signed in from the link, choosing a new password.',
    build: () => withSampleData(signedIn('reset-password', {})),
  },
  {
    id: 'join-team', group: 'Onboarding', label: 'Accept a team invite', path: '/onboarding',
    description: 'Signed in with a pending invite to Sample Brand Co.',
    build: () => signedIn('join-team', null, { pendingInvite: 'preview-invite' }),
  },
  {
    id: 'name-brand', group: 'Onboarding', label: 'Name your brand', path: '/onboarding',
    description: 'Signed in with no brand name from sign-up (e.g. after declining an invite).',
    build: () => signedIn('name-brand', null),
  },
  {
    id: 'setup-settings', group: 'Onboarding', label: 'Post to Pay settings', path: '/onboarding',
    description: 'First setup step for a new brand.',
    build: () => signedIn('setup-settings', notSetUp, { shopify: 'not_connected' }),
  },
  {
    id: 'setup-terms', group: 'Onboarding', label: 'Terms and privacy', path: '/onboarding',
    description: 'Settings saved; the Merchant Terms are next.',
    build: () => signedIn('setup-terms', { terms_accepted_at: null, terms_accepted_version: null }, { shopify: 'not_connected' }),
  },
  {
    id: 'setup-shopify', group: 'Onboarding', label: 'Connect Shopify', path: '/onboarding?step=shopify',
    description: 'The last, optional step: settings and terms are done, no store connected yet.',
    build: () => signedIn('setup-shopify', {}, { shopify: 'not_connected' }),
  },
  {
    id: 'day-one', group: 'Dashboard', label: 'Day one, Shopify not connected', path: '/dashboard',
    description: 'Setup finished but no store connected and no orders yet.',
    build: () => signedIn('day-one', {}, { shopify: 'not_connected' }),
  },
  {
    id: 'day-one-connected', group: 'Dashboard', label: 'Day one, store connected', path: '/dashboard',
    description: 'Store connected, waiting for the first Vouch order.',
    build: () => signedIn('day-one-connected', {}),
  },
  {
    id: 'missing-metrics', group: 'Dashboard', label: 'Posts with missing metrics', path: '/dashboard',
    description: 'Explicit sample posts with missing views and engagement to check unavailable totals.',
    build: () => {
      const state = withSampleData(signedIn('missing-metrics', {}));
      state.tables.vouch_posts = state.tables.vouch_posts.map((post, index) => index % 2 === 0
        ? { ...post, views: null, likes: null, comments: null } : post);
      return state;
    },
  },
  {
    id: 'active', group: 'Dashboard', label: 'Active brand with sample orders', path: '/dashboard',
    description: `${sampleCounts.orders} Post to Pay orders across every stage, ${sampleCounts.posts} posts and ${sampleCounts.creators} creators.`,
    build: () => withSampleData(signedIn('active', {})),
  },
  {
    id: 'whole-cart', group: 'Dashboard', label: 'Whole-cart orders', path: '/dashboard/orders',
    description: 'The active brand, opened on Gifts. Its six whole-cart cases: #1031 other items paid in full, #1032 with shipping, '
      + '#1033 rounding refund refunded, #1034 rounding refund not yet refunded, #1035 re-priced at checkout, #1036 canceled after a declined card.',
    build: () => withSampleData(signedIn('whole-cart', {})),
  },
  {
    id: 'welcome', group: 'Dashboard', label: 'First visit welcome', path: '/dashboard',
    description: 'The welcome message and guided tour offered on a first visit.',
    build: () => withSampleData(signedIn('welcome', {})),
  },
  {
    id: 'viewer', group: 'Dashboard', label: 'Viewer role', path: '/dashboard',
    description: 'Same sample data, signed in as a teammate who can only view.',
    build: () => withSampleData(signedIn('viewer', {}, {}, { id: 'preview-user-3', brand_role: 'viewer', full_name: 'Casey Lee', job_title: 'Marketing', email: 'casey@example.com' })),
  },
  {
    id: 'loading', group: 'Dashboard', label: 'Loading', path: '/dashboard',
    description: 'Orders and posts never finish loading, to review loading states.',
    build: () => signedIn('loading', {}, { dataMode: 'loading' }),
  },
  {
    id: 'error', group: 'Dashboard', label: 'Connection error', path: '/dashboard',
    description: 'Orders and posts fail to load, to review error states.',
    build: () => signedIn('error', {}, { dataMode: 'error' }),
  },
];

export const DEFAULT_SCENARIO = 'signed-out';
