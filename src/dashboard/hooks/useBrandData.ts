import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@dashboard/integrations/supabase/client';
import { useAuth } from '@dashboard/hooks/useAuth';
import type { Brand, Profile, VouchOrder, VouchPost, Influencer } from '@dashboard/types/vouch';
import { sha256Hex, type LegalText } from '@dashboard/lib/legalDocuments';
import { normalizeHandle, validateSettings, type PostToPaySettings } from '@dashboard/lib/postToPaySettings';
import { tidyMessaging, validateMessaging, type BrandMessaging } from '@dashboard/lib/brandMessaging';
import { tidyButton, validateButton, type StorefrontButton } from '@dashboard/lib/storefrontButton';

import { allCheckoutTransactions } from '@dashboard/lib/checkoutApi';
import { mergeCheckoutOrders } from '@dashboard/lib/checkoutDashboard';

const EMPTY_ORDERS: VouchOrder[] = [];
const EMPTY_POSTS: VouchPost[] = [];

/**
 * An enabled query is still loading until it has data or a final error. TanStack's own
 * `isLoading` is false while a fetch is paused (offline, or a retry waiting for the tab to
 * regain focus), which would otherwise let pages show "no activity" for a load that failed.
 */
function loadingEnabled(enabled: boolean, isPending: boolean) {
  return enabled && isPending;
}

export function useBrandProfile() {
  const { user } = useAuth();

  const { data: profile, isPending, error, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as unknown as Profile;
    },
    enabled: !!user,
  });

  return { profile, isLoading: loadingEnabled(!!user, isPending), error, refetch };
}

export function useBrand() {
  const { profile, isLoading: profileLoading, error: profileError } = useBrandProfile();

  const { data: brand, isPending, error } = useQuery({
    queryKey: ['brand', profile?.brand_id],
    queryFn: async () => {
      if (!profile?.brand_id) return null;
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', profile.brand_id)
        .single();
      if (error) throw error;
      return data as unknown as Brand;
    },
    enabled: !!profile?.brand_id,
  });

  return { brand, isLoading: profileLoading || loadingEnabled(!!profile?.brand_id, isPending), error: profileError ?? error };
}

// Every order shows, whatever its former test or live mode (owner decision, October 12).
export function useBrandOrders() {
  const { profile, isLoading: profileLoading, error: profileError, refetch: retryProfile } = useBrandProfile();

  const query = useQuery({
    queryKey: ['orders', profile?.brand_id],
    queryFn: async () => {
      if (!profile?.brand_id) return [];
      const data: VouchOrder[] = [];
      for (let offset = 0; ; offset += 500) {
        const page = await supabase.from('vouch_orders').select('*, influencer:influencers(*)')
          .eq('brand_id', profile.brand_id).order('id').range(offset, offset + 499);
        if (page.error) throw page.error;
        data.push(...page.data as VouchOrder[]);
        if (page.data.length < 500) break;
      }
      const canonical = await allCheckoutTransactions();
      return mergeCheckoutOrders(data as unknown as VouchOrder[], canonical);
    },
    enabled: !!profile?.brand_id,
  });
  return { ...query, refetch: profileError ? retryProfile : query.refetch, isLoading: profileLoading || loadingEnabled(!!profile?.brand_id, query.isPending), error: profileError ?? query.error, data: query.data ?? EMPTY_ORDERS };
}

export function useBrandPosts() {
  const orders = useBrandOrders();
  const { profile, isLoading: profileLoading, error: profileError, refetch: retryProfile } = useBrandProfile();

  const query = useQuery({
    queryKey: ['posts', profile?.brand_id],
    queryFn: async () => {
      if (!profile?.brand_id) return [];
      const data: VouchPost[] = [];
      for (let offset = 0; ; offset += 500) {
        const page = await supabase.from('vouch_posts').select('*, influencer:influencers(*)')
          .eq('brand_id', profile.brand_id).order('id').range(offset, offset + 499);
        if (page.error) throw page.error;
        data.push(...page.data as VouchPost[]);
        if (page.data.length < 500) break;
      }
      data.sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at));
      return data as unknown as VouchPost[];
    },
    enabled: !!profile?.brand_id,
  });
  return { ...query, refetch: profileError ? retryProfile : query.refetch, isLoading: orders.isLoading || profileLoading || loadingEnabled(!!profile?.brand_id, query.isPending), error: orders.error ?? profileError ?? query.error, data: useMemo(() => (query.data ?? EMPTY_POSTS).flatMap(post => {
    const order = orders.data.find(o => o.id === (post.checkout_offer_id ?? post.order_id) || o.legacyOrderIds?.includes(post.order_id));
    if (!order) return [post];
    return [{ ...post, order_id: order.id, influencer_id: order.influencer_id, influencer: order.influencer }];
  }), [query.data, orders.data]) };
}

export function useBrandInfluencers() {
  const { data: orders = [] } = useBrandOrders();

  const influencers = useMemo(() => orders.reduce<Influencer[]>((acc, order) => {
    if (order.influencer && !acc.some(i => i.id === order.influencer!.id)) {
      acc.push(order.influencer);
    }
    return acc;
  }, []), [orders]);

  return { influencers };
}

export function useSaveBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brand: Brand) => {
      if (!brand.name.trim()) throw new Error('Enter a brand name.');
      const { data, error } = await supabase.from('brands').update({
        name: brand.name.trim(),
        contact_email: brand.contact_email?.trim() || null,
      }).eq('id', brand.id).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('The brand update was not confirmed.');
      return data;
    },
    onSuccess: (brand) => queryClient.setQueryData(['brand', brand.id], brand),
  });
}

export function useSaveBrandMessaging() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId, messaging }: { brandId: string; messaging: BrandMessaging }) => {
      const problem = validateMessaging(messaging);
      if (problem) throw new Error(problem);
      const { data, error } = await supabase.from('brands').update(tidyMessaging(messaging))
        .eq('id', brandId).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('The brand messaging update was not confirmed.');
      return data;
    },
    onSuccess: (brand) => queryClient.setQueryData(['brand', brand.id], brand),
  });
}

export function useSaveStorefrontButton() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId, button }: { brandId: string; button: StorefrontButton }) => {
      const problem = validateButton(button);
      if (problem) throw new Error(problem);
      const { data, error } = await supabase.from('brands').update(tidyButton(button))
        .eq('id', brandId).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('The button settings update was not confirmed.');
      return data;
    },
    onSuccess: (brand) => queryClient.setQueryData(['brand', brand.id], brand),
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fullName, jobTitle }: { id: string; fullName: string; jobTitle: string }) => {
      if (!fullName.trim()) throw new Error('Enter your name.');
      if (!jobTitle.trim()) throw new Error('Enter your title.');
      const { data, error } = await supabase.from('profiles')
        .update({ full_name: fullName.trim(), job_title: jobTitle.trim() })
        .eq('id', id).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('The profile update was not confirmed.');
      return data as unknown as Profile;
    },
    onSuccess: (profile) => queryClient.setQueryData(['profile', profile.id], profile),
  });
}

/** The brand's most recent acceptance of the Merchant Terms, for the record shown in Settings. */
export function useTermsAcceptance() {
  const { profile } = useBrandProfile();
  return useQuery({
    queryKey: ['terms-acceptance', profile?.brand_id],
    enabled: !!profile?.brand_id,
    queryFn: async () => {
      const { data, error } = await supabase.from('legal_acceptances')
        .select('version, accepted_at, user_email')
        .eq('brand_id', profile!.brand_id!)
        .eq('document', 'merchant_terms')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSavePostToPaySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ brandId, settings, completeSetup = false }: { brandId: string; settings: PostToPaySettings; completeSetup?: boolean }) => {
      const problem = validateSettings(settings);
      if (problem) throw new Error(problem);
      const { data, error } = await supabase.from('brands').update({
        ...settings,
        instagram_username: normalizeHandle(settings.instagram_username, 'instagram') || null,
        tiktok_username: normalizeHandle(settings.tiktok_username, 'tiktok') || null,
        ...(completeSetup ? { settings_completed_at: new Date().toISOString() } : {}),
      }).eq('id', brandId).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('Only owners and admins can change these settings.');
      return data;
    },
    onSuccess: (brand) => queryClient.setQueryData(['brand', brand.id], brand),
  });
}

export function useAcceptMerchantTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ terms, privacy }: { terms: LegalText; privacy: LegalText }) => {
      const { error } = await supabase.rpc('accept_merchant_terms', {
        p_version: terms.version, p_sha256: await sha256Hex(terms.text),
        p_privacy_version: privacy.version, p_privacy_sha256: await sha256Hex(privacy.text),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand'], refetchType: 'all' }),
  });
}
