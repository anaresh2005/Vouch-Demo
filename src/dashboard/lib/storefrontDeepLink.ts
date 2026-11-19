// One-click "Add to product page": a Shopify theme editor deep link that opens the store's live
// theme on the product template with the Post to Pay app block added to its main section, ready
// for the merchant to position and save. Format:
// https://{shop}.myshopify.com/admin/themes/current/editor?template=product&addAppBlockId={api_key}/{block}&target=mainSection
// See docs/shopify-checkout-flow.md (Lane B, October 8; dashboard link, October 12).

/** The block's file name in extensions/vouch-post-to-pay/blocks, without .liquid. */
export const POST_TO_PAY_BLOCK = 'post-to-pay';

/**
 * The theme editor link, or null unless the store is a .myshopify.com address and the key is an app
 * API key. The key must be the client ID (public, not a secret) of the app the store is connected
 * through, main or pilot, which shopify-status returns as app_client_id.
 */
export function addPostToPayBlockUrl(shopDomain: string | null | undefined, apiKey: string | null | undefined): string | null {
  const shop = validShop(shopDomain);
  if (!shop || !validKey(apiKey)) return null;
  // Every part is validated, so the documented format is used as is (an unencoded "/").
  return `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${apiKey}/${POST_TO_PAY_BLOCK}&target=mainSection`;
}

/** The cart watcher's app embed file name in extensions/vouch-post-to-pay/blocks, without .liquid. */
export const POST_TO_PAY_CART_EMBED = 'post-to-pay-cart';

/**
 * "Turn on in your theme" for the cart watcher (owner decision, October 14): Shopify's app embed deep link,
 * which opens the live theme's App embeds with Vouch's embed switched on, ready for the merchant to save.
 * Format (shopify.dev, theme app extensions, "App embed block deep linking"):
 * https://{shop}.myshopify.com/admin/themes/current/editor?context=apps&activateAppId={api_key}/{handle}
 * Same store and key rules as addPostToPayBlockUrl.
 */
export function activateCartEmbedUrl(shopDomain: string | null | undefined, apiKey: string | null | undefined): string | null {
  const shop = validShop(shopDomain);
  if (!shop || !validKey(apiKey)) return null;
  return `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/${POST_TO_PAY_CART_EMBED}`;
}

function validShop(shopDomain: string | null | undefined) {
  const shop = shopDomain?.trim().toLowerCase();
  return shop && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop) ? shop : null;
}
const validKey = (apiKey: string | null | undefined) => !!apiKey && /^[0-9a-f]{32}$/.test(apiKey);
