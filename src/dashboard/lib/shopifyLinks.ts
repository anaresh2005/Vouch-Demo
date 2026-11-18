/** Only build admin links from a known Shopify store and a real numeric order ID. */
export function shopifyOrderUrl(shopDomain: string | null | undefined, orderId: string | null | undefined): string | null {
  const shop = shopDomain?.match(/^([a-z0-9][a-z0-9-]*)\.myshopify\.com$/i)?.[1];
  const id = orderId?.match(/^(?:gid:\/\/shopify\/Order\/)?([0-9]+)$/)?.[1];
  if (!shop || !id) return null;
  return `https://admin.shopify.com/store/${shop.toLowerCase()}/orders/${id}`;
}
