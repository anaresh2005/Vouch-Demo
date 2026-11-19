import { supabase } from '@dashboard/integrations/supabase/client';
import type { CheckoutDashboardRow } from '@dashboard/types/checkout';
export async function checkoutRequest(action: string, input: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('vouch-checkout', { body: { action, ...input } });
  if (error) {
    const response = 'context' in error ? error.context : null;
    const detail = response instanceof Response ? await response.json().catch(() => null) : null;
    throw new Error(detail?.error ?? 'Transaction data is unavailable. Please retry.');
  }
  if (!data || data.error) throw new Error(data?.error ?? 'Transaction response is unavailable.');
  return data;
}
export async function allCheckoutTransactions(): Promise<CheckoutDashboardRow[]> {
  const rows: CheckoutDashboardRow[] = [];
  const seen = new Set<string>();
  let after: string | undefined, before: string | undefined;
  do {
    const page = await checkoutRequest('transactions', { after, before });
    if (!Array.isArray(page.offers) || typeof page.before !== 'string') throw new Error('Incomplete transaction response.');
    rows.push(...page.offers);
    before = page.before;
    after = page.next ?? undefined;
    if (after && seen.has(after)) throw new Error('Transaction pagination did not advance.');
    if (after) seen.add(after);
  } while (after);
  return rows;
}
