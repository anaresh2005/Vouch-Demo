import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@dashboard/integrations/supabase/client';
import { useToast } from './use-toast';
import { useBrandProfile } from './useBrandData';

// An invite link survives sign-up and email confirmation (which may open a new tab),
// so it is kept in localStorage until it is accepted or set aside.
const PENDING_INVITE_KEY = 'vouch.pendingInvite';

export function savePendingInvite(token: string) {
  localStorage.setItem(PENDING_INVITE_KEY, token);
}
export function getPendingInvite() {
  return localStorage.getItem(PENDING_INVITE_KEY);
}
export function clearPendingInvite() {
  localStorage.removeItem(PENDING_INVITE_KEY);
}

/**
 * An account belongs to one brand, and the server refuses to add it to a second. When someone who
 * already has a brand signs in with an invite pending, set the invite aside and say why, rather
 * than dropping it silently or leaving it to hide the brand-name field from the next sign-up here.
 */
export function useSetAsideInviteForMember(brandName: string | undefined) {
  const { toast } = useToast();
  useEffect(() => {
    if (!brandName || !getPendingInvite()) return;
    clearPendingInvite();
    toast({
      title: "You can't join another team with this account",
      description: `This account already belongs to ${brandName}, and an account can only belong to one brand. `
        + 'To accept the invite, sign out and open the invite link again to create an account with a different email, '
        + 'or ask the person who invited you.',
      duration: 20_000,
    });
  }, [brandName, toast]);
}

export function inviteLink(token: string) {
  return `${window.location.origin}/join?invite=${encodeURIComponent(token)}`;
}

export type BrandRole = 'owner' | 'admin' | 'viewer';
export type InviteRole = Exclude<BrandRole, 'owner'>;
export type BrandInvite = { id: string; brand_role: InviteRole; created_at: string; expires_at: string };
export type BrandMember = { user_id: string; email: string | null; full_name: string | null; brand_role: BrandRole; joined_at: string };

// What the signed-in person may do on their brand. The database enforces the same rules.
export function useBrandRole() {
  const { profile, isLoading } = useBrandProfile();
  const role = (profile?.brand_role ?? null) as BrandRole | null;
  return {
    role,
    isLoading,
    isOwner: role === 'owner',
    canManageBrand: role === 'owner' || role === 'admin',
  };
}

export function useBrandInvites() {
  const { profile } = useBrandProfile();
  const queryClient = useQueryClient();
  const queryKey = ['brand-invites', profile?.brand_id];

  const invites = useQuery({
    queryKey,
    enabled: !!profile?.brand_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_invites')
        .select('id, brand_role, created_at, expires_at')
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrandInvite[];
    },
  });

  const create = useMutation({
    mutationFn: async (role: InviteRole) => {
      const { data, error } = await supabase.rpc('create_brand_invite', { p_role: role });
      if (error) throw error;
      return inviteLink(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const revoke = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.rpc('revoke_brand_invite', { p_invite_id: inviteId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { invites, create, revoke };
}

export function useBrandMembers() {
  const { profile } = useBrandProfile();
  const queryClient = useQueryClient();
  const queryKey = ['brand-members', profile?.brand_id];
  // Role changes can affect the signed-in person too (for example after transferring ownership).
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const members = useQuery({
    queryKey,
    enabled: !!profile?.brand_id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_brand_members');
      if (error) throw error;
      return data as BrandMember[];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: InviteRole }) => {
      const { error } = await supabase.rpc('set_brand_member_role', { p_user_id: userId, p_role: role });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_brand_member', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const transfer = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('transfer_brand_ownership', { p_user_id: userId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { members, setRole, remove, transfer, currentUserId: profile?.id };
}

export async function previewInvite(token: string) {
  const { data, error } = await supabase.rpc('preview_brand_invite', { p_token: token });
  if (error) throw error;
  return data;
}

export async function acceptInvite(token: string) {
  const { error } = await supabase.rpc('accept_brand_invite', { p_token: token });
  if (error) throw error;
}
