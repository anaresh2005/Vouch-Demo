import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@dashboard/integrations/supabase/client';
import { useBrandProfile } from '@dashboard/hooks/useBrandData';
import type { Database } from '@dashboard/integrations/supabase/types';

export type PostReport = Database['public']['Tables']['vouch_post_reports']['Row'];
export type ReportReason = 'nudity' | 'profanity' | 'violence' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'profanity', label: 'Profanity or hate speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'other', label: 'Something else that can’t be fixed' },
];

/** The recorded report for one post, or null when it hasn't been reported. */
export function usePostReport(postId: string) {
  const { profile } = useBrandProfile();
  return useQuery({
    queryKey: ['post-reports', profile?.brand_id, postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('vouch_post_reports').select('*')
        .eq('brand_id', profile!.brand_id!).eq('post_id', postId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.brand_id,
  });
}

/** Records that an owner or admin reported a post to Instagram or TikTok. */
export function useMarkPostReported() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: ReportReason }) => {
      const { data, error } = await supabase.rpc('mark_post_reported', { p_post_id: postId, p_reason: reason });
      if (error) throw error;
      if (!data) throw new Error('The report was not confirmed.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-reports'] }),
  });
}
