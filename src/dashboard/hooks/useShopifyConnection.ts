import { FunctionsHttpError } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@dashboard/integrations/supabase/client';
import { useBrandProfile } from './useBrandData';

const statusSchema = z.object({
  state: z.enum(['not_connected', 'connected', 'needs_reconnect', 'disconnected']),
  connection: z.object({
    shop_domain: z.string(),
    shop_name: z.string().nullable(),
    shop_currency: z.string().nullable(),
    last_webhook_at: z.string().nullable(),
    last_webhook_topic: z.string().nullable(),
    // Only when connected: the client ID (public) of the Shopify app the store connected through.
    app_client_id: z.string().optional(),
  }).nullable(),
});

async function invoke(name: string, body: object = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error instanceof FunctionsHttpError) {
    const result = await error.context.json().catch(() => null);
    throw new Error(result?.error ?? 'Could not reach Vouch. Please try again.');
  }
  if (error) throw new Error('Could not reach Vouch. Please check your connection and try again.');
  return data;
}

/**
 * The store's permanent your-store.myshopify.com address from what a merchant typed or pasted:
 * a handle, that address (with or without https:// or a path), or a Shopify admin link such as
 * admin.shopify.com/store/your-store. The backend checks the result again.
 */
export function shopDomainFrom(input: string) {
  const address = input.trim().toLowerCase().replace(/^https?:\/\//, '');
  const adminHandle = address.match(/^admin\.shopify\.com\/store\/([^/?#]+)/)?.[1];
  const host = adminHandle ?? address.split(/[/?#]/)[0];
  if (!adminHandle && host.includes('.') && !host.endsWith('.myshopify.com')) {
    throw new Error(`${host} looks like a custom domain. Enter your store handle or its .myshopify.com address instead; `
      + 'you can find it in Shopify admin under Settings > Domains.');
  }
  const shop = host.endsWith('.myshopify.com') ? host : `${host}.myshopify.com`;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
    throw new Error('Enter your store handle or its .myshopify.com address.');
  }
  return shop;
}

export async function connectShopify(input: string) {
  const shop = shopDomainFrom(input);
  const result = z.object({ authorize_url: z.string().url() }).parse(
    await invoke('shopify-install', {
      shop,
      return_origin: window.location.origin,
    }),
  );
  const state = new URL(result.authorize_url).searchParams.get('state');
  if (!state) throw new Error('Could not start Shopify authorization. Please try again.');
  // Remember the attempt in this tab, on this dashboard origin, before leaving.
  sessionStorage.setItem('vouch.shopify.state', state);
  window.location.assign(result.authorize_url);
}

export async function completeShopify(query: string) {
  const state = new URLSearchParams(query).get('state');
  if (!state || state !== sessionStorage.getItem('vouch.shopify.state')) {
    throw new Error('Start and finish Shopify authorization in the same Vouch tab. Please connect again.');
  }
  sessionStorage.removeItem('vouch.shopify.state');
  // The backend independently checks the signed callback and the current user's
  // ownership of the attempt. A browser-only state check is not sufficient.
  z.object({ completed: z.literal(true) }).parse(await invoke('shopify-callback', { query }));
}

export function useShopifyConnection(enabled = true) {
  const { profile, isLoading, error } = useBrandProfile();
  const query = useQuery({
    queryKey: ['shopify_connection', profile?.brand_id],
    queryFn: async () => statusSchema.parse(await invoke('shopify-status')),
    enabled: enabled && !!profile?.brand_id,
    staleTime: 30_000,
    retry: false,
  });
  return { ...query, isLoading: isLoading || query.isLoading, error: error ?? query.error };
}
