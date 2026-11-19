import { Link } from 'react-router-dom';
import { useBrandRole } from '@dashboard/hooks/useBrandInvites';
import { useShopifyConnection } from '@dashboard/hooks/useShopifyConnection';

// Setup lets someone skip connecting Shopify (an agency's developers may install it), so owners and
// admins see a reminder across the top of every page until the store is connected, as Stripe does for
// its test mode. Connecting the store gives Vouch product access; it does not activate Post to Pay.
export function ShopifyReminder() {
  const { canManageBrand } = useBrandRole();
  const { data } = useShopifyConnection(canManageBrand);
  if (!canManageBrand || !data || data.state === 'connected') return null;
  const reconnect = data.state === 'needs_reconnect';
  return (
    <div role="status" className="flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-banner px-4 py-2 text-sm text-white">
      <span>
        {reconnect
          ? 'Your Shopify store needs to be reconnected so Vouch can keep accessing your products.'
          : "Your Shopify store isn't connected yet. Connect it so Vouch can access your products."}
      </span>
      <Link to="/onboarding?step=shopify" className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-sm font-medium text-white hover:bg-primary-hover">
        {reconnect ? 'Reconnect Shopify' : 'Connect Shopify'}
      </Link>
    </div>
  );
}
