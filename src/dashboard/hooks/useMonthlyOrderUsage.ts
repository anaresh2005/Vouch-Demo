import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { checkoutRequest } from '@dashboard/lib/checkoutApi';
import { useBrandProfile } from './useBrandData';

const usageSchema = z.object({
  usage: z.object({
    limit: z.number(),
    orders: z.number(),
    resetDate: z.string(),
  }).nullable(),
});
export type MonthlyOrderUsage = NonNullable<z.infer<typeof usageSchema>['usage']>;

/** This month's Post to Pay orders against the store's monthly limit, or null before checkout is set up. */
export function useMonthlyOrderUsage() {
  const { profile } = useBrandProfile();
  return useQuery({
    queryKey: ['monthly-order-usage', profile?.brand_id],
    queryFn: async () => usageSchema.parse(await checkoutRequest('monthly_usage')).usage,
    enabled: !!profile?.brand_id,
  });
}
