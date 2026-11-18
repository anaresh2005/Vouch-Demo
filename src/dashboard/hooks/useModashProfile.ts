import { useQuery } from '@tanstack/react-query';
import { supabase } from '@dashboard/integrations/supabase/client';
import { useBrandProfile } from '@dashboard/hooks/useBrandData';
import type { ModashProfileData } from '@dashboard/types/modash';

export function useModashProfile(platform: 'instagram' | 'tiktok', username: string | null, enabled: boolean) {
  const { profile } = useBrandProfile();
  return useQuery({
    queryKey: ['modash-profile', profile?.brand_id, platform, username?.toLowerCase()],
    queryFn: async (): Promise<ModashProfileData> => {
      const { data, error } = await supabase.functions.invoke('modash-profile', {
        body: { platform, username },
      });
      if (error || data?.error) throw new Error('Profile data is unavailable. Please try again.');
      if (!data?.data || !Array.isArray(data.data.recentPosts)) throw new Error('The profile response was incomplete.');
      return { ...data.data, fetchedAt: typeof data.fetchedAt === 'string' ? data.fetchedAt : null };
    },
    enabled: enabled && !!username && !!profile?.brand_id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
