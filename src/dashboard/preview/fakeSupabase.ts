// Stand-in for the Supabase client in the demo's merchant dashboard. Copied from Vouch-MVP-Production's
// design preview (src/preview/fakeSupabase.ts, henry/creator-profile-cache, November 2026);
// integrations/supabase/client.ts re-exports it, so the demo never reaches a database. Reads come
// from the sample data; the demo dashboard is read-only (Henry, November 18, 2026), so every
// write is refused with one message instead of being saved.
import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@dashboard/integrations/supabase/types';
import { DEFAULT_SCENARIO, SCENARIOS, type PreviewState } from './scenarios';
import { forgetWelcomeSeen, markWelcomeSeen } from '@dashboard/hooks/useTour';
import { SAMPLE_BRAND_ID, SAMPLE_USER_ID, sampleBrand, sampleProfile } from './sampleData';

const STORAGE_KEY = 'vouch-demo:dashboard';
export const READ_ONLY = 'This is a demo, so changes aren’t saved.';
const INVITE_KEY = 'vouch.pendingInvite';
const LATENCY_MS = 250;

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export function scenarioState(id: string): PreviewState {
  const scenario = SCENARIOS.find(s => s.id === id) ?? SCENARIOS.find(s => s.id === DEFAULT_SCENARIO)!;
  return scenario.build();
}

function load(): PreviewState {
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('scenario');
  if (requested) {
    url.searchParams.delete('scenario');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    return fresh(requested);
  }
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as PreviewState;
  } catch { /* fall through to the default scenario */ }
  return fresh('active');
}

function fresh(id: string) {
  const next = scenarioState(id);
  if (next.pendingInvite) localStorage.setItem(INVITE_KEY, next.pendingInvite);
  else localStorage.removeItem(INVITE_KEY);
  // The first-visit welcome would cover every dashboard screen; only its own scenario shows it.
  // Signed-out scenarios sign in (or up) as the sample owner, so that account is covered too.
  const userId = next.user?.id ?? SAMPLE_USER_ID;
  if (id === 'welcome') forgetWelcomeSeen(userId);
  else markWelcomeSeen(userId);
  persist(next);
  return next;
}

function persist(next: PreviewState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* preview still works in memory */ }
}

const state = load();
// A tab saved before post reports existed has no table for them.
state.tables.vouch_post_reports ??= [];
export const previewScenario = () => state.scenario;

const wait = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), LATENCY_MS));
const readOnly = () => wait<Result>({ data: null, error: { message: READ_ONLY } });
const never = () => new Promise<never>(() => {});
const currentProfile = () => state.tables.profiles.find(p => p.id === state.user?.id);

// Orders and posts follow the scenario's loading/error mode; everything else always loads.
const DATA_TABLES = new Set(['vouch_orders', 'vouch_posts']);

type Filter = (row: Row) => boolean;

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private action: 'select' | 'update' | 'insert' = 'select';
  private patch: Row = {};
  private sort: { column: string; ascending: boolean } | null = null;
  private max: number | null = null;
  private offset = 0;
  private one: 'single' | 'maybe' | null = null;

  constructor(private table: keyof PreviewState['tables']) {}

  select() { return this; }
  update(patch: Row) { this.action = 'update'; this.patch = patch; return this; }
  insert(rows: Row | Row[]) { this.action = 'insert'; this.patch = { rows: Array.isArray(rows) ? rows : [rows] }; return this; }
  eq(column: string, value: unknown) { this.filters.push(row => row[column] === value); return this; }
  neq(column: string, value: unknown) { this.filters.push(row => row[column] !== value); return this; }
  is(column: string, value: unknown) { this.filters.push(row => (row[column] ?? null) === value); return this; }
  gt(column: string, value: string | number) { this.filters.push(row => (row[column] as string | number) > value); return this; }
  in(column: string, values: unknown[]) { this.filters.push(row => values.includes(row[column])); return this; }
  order(column: string, options: { ascending?: boolean } = {}) { this.sort = { column, ascending: options.ascending ?? true }; return this; }
  limit(count: number) { this.max = count; return this; }
  range(from: number, to: number) { this.offset = from; this.max = to - from + 1; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }

  then<A = Result, B = never>(resolve?: ((value: Result) => A | PromiseLike<A>) | null, reject?: ((reason: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(resolve, reject);
  }

  private async run(): Promise<Result> {
    if (DATA_TABLES.has(this.table) && state.dataMode === 'loading') return never();
    if (DATA_TABLES.has(this.table) && state.dataMode === 'error') {
      return wait({ data: null, error: { message: 'Preview: simulated connection error.' } });
    }
    const rows = state.tables[this.table] as unknown as Row[];
    if (this.action !== 'select') return readOnly();
    let matches = rows.filter(row => this.filters.every(test => test(row)));
    if (this.sort) {
      const { column, ascending } = this.sort;
      matches = [...matches].sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1));
    }
    if (this.max !== null) matches = matches.slice(this.offset, this.offset + this.max);
    const data = structuredClone(matches);
    if (this.one === 'single') {
      return wait(data.length === 1 ? { data: data[0], error: null } : { data: null, error: { message: 'Preview: no matching row.' } });
    }
    if (this.one === 'maybe') return wait({ data: data[0] ?? null, error: null });
    return wait({ data, error: null });
  }
}

async function rpc(name: string): Promise<Result> {
  // Reads only; every other function would change the brand.
  if (name === 'list_brand_members') return wait({ data: structuredClone(state.members), error: null });
  if (name === 'preview_brand_invite') return wait({ data: 'Harbor & Pine', error: null });
  return readOnly();
}

function unavailable(message: string) {
  return wait({ data: null, error: new FunctionsHttpError(new Response(JSON.stringify({ error: message }), { status: 400 })) });
}

// The scenario's sample Post to Pay orders, for the signed-in brand.
function previewTransactions() {
  const brandId = currentProfile()?.brand_id ?? SAMPLE_BRAND_ID;
  return (state.transactions ?? []).map(row => ({ ...row, brandId }));
}

async function invoke(name: string, options?: { body?: { action?: string } }): Promise<{ data: unknown; error: unknown }> {
  if (name === 'vouch-checkout' && options?.body?.action === 'transactions') return wait({ data: { offers: previewTransactions(), next: null, before: new Date().toISOString() }, error: null });
  if (name === 'vouch-checkout' && (options?.body?.action === 'cancel_order' || options?.body?.action === 'flag_post')) return unavailable(READ_ONLY);
  if (name === 'vouch-checkout' && options?.body?.action === 'monthly_usage') return wait({ data: { usage: { limit: 100, orders: Math.min(state.transactions?.length ?? 0, 100), resetDate: 'November 1' } }, error: null });
  if (name === 'shopify-status') {
    const connected = state.shopify !== 'not_connected';
    return wait({
      data: {
        state: state.shopify,
        connection: connected ? {
          shop_domain: 'harbor-and-pine.myshopify.com', shop_name: 'Harbor & Pine', shop_currency: 'USD',
          last_webhook_at: new Date(Date.now() - 3_600_000).toISOString(), last_webhook_topic: 'orders/create',
        } : null,
      },
      error: null,
    });
  }
  if (name.startsWith('shopify-')) return unavailable(READ_ONLY);
  if (name === 'modash-profile') {
    // Preview only: an invented saved profile, as Vouch serves it (fetched two days ago). No Modash call is made.
    const body = (options?.body ?? {}) as { username?: string };
    const seed = [...(body.username ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0);
    const followers = 4000 + (seed % 40) * 1500;
    const posts = Array.from({ length: 6 }, (_, i) => ({ id: `sample-${i}`, url: 'https://www.instagram.com/', caption: 'Sample post (preview only)',
      thumbnail: null, views: Math.round(followers * (0.4 + i * 0.05)), likes: Math.round(followers * 0.04), comments: 12 + i, shares: 2,
      created: new Date(Date.now() - (i + 1) * 4 * 86_400_000).toISOString() }));
    return wait({ data: { error: false, fetchedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), data: {
      followers, engagementRate: 4.2, avgLikes: Math.round(followers * 0.04), avgComments: 18, avgViews: Math.round(followers * 0.5), avgShares: 3,
      postsCount: 120 + (seed % 200), postingFrequency: null, nonSponsoredPostsMedianViews: Math.round(followers * 0.45),
      nonSponsoredPostsMedianLikes: Math.round(followers * 0.035), sponsoredPostsMedianViews: null, sponsoredPostsMedianLikes: null,
      audience: { countries: [], cities: [], languages: [], ages: [], genders: [], interests: [], credibility: null, notableUsers: [] },
      recentPosts: posts, popularPosts: [], sponsoredPosts: [],
    } }, error: null });
  }
  return unavailable(READ_ONLY);
}

// ── Auth ───────────────────────────────────────────────────────────────────

type Listener = (event: string, session: unknown) => void;
const listeners = new Set<Listener>();

const session = () => state.user ? {
  access_token: 'preview', refresh_token: 'preview', token_type: 'bearer', expires_in: 3600,
  user: { ...state.user, aud: 'authenticated', app_metadata: {}, created_at: new Date().toISOString() },
} : null;

function announce(event: string) {
  persist(state);
  const current = session();
  setTimeout(() => listeners.forEach(listener => listener(event, current)), 0);
}

const auth = {
  onAuthStateChange(listener: Listener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  },
  async getSession() { return { data: { session: session() }, error: null }; },
  async signInWithPassword({ email }: { email: string; password: string }) {
    // Any credentials open the sample dashboard, like the "Active brand" scenario.
    const active = scenarioState('active');
    Object.assign(state, active, { scenario: state.scenario, user: { ...active.user!, email } });
    await wait(null);
    announce('SIGNED_IN');
    return { data: { session: session() }, error: null };
  },
  async signUp({ email, options }: { email: string; password: string; options?: { data?: Record<string, string | undefined> } }) {
    const user = { id: SAMPLE_USER_ID, email, user_metadata: options?.data ?? {} };
    Object.assign(state, scenarioState('signed-out'), { scenario: state.scenario, user, pendingInvite: localStorage.getItem(INVITE_KEY) });
    state.tables.profiles = [sampleProfile({
      email, full_name: user.user_metadata.full_name ?? null, job_title: user.user_metadata.job_title ?? null,
      brand_id: null, brand_role: null,
    })];
    await wait(null);
    announce('SIGNED_IN');
    return { data: { session: session(), user }, error: null };
  },
  async signOut() {
    state.user = null;
    announce('SIGNED_OUT');
    return { error: null };
  },
  // No email is sent from the preview; the "Reset password" scenario shows where the link leads.
  async resetPasswordForEmail() {
    return wait({ data: {}, error: null });
  },
  // Accepts any new password for the signed-in sample user; nothing is stored.
  async updateUser() {
    if (!state.user) return wait({ data: { user: null }, error: { message: 'Preview: sign in first.' } });
    return wait({ data: { user: session()!.user }, error: null });
  },
};

const fake = {
  auth,
  from: (table: keyof PreviewState['tables']) => new Query(table),
  rpc,
  functions: { invoke },
};

export const supabase = fake as unknown as SupabaseClient<Database>;
