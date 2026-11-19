// Vouch's servicing state, read by the order timeline (shipped or not); merchants aren't shown the rest.
export type ServicingStatus = {
  state?: string;
  message?: string;
  fulfillment?: string;
  authorization?: { state: string; expiresAt?: string | null };
  schedule?: string;
  // The newest shipment's tracking from Shopify (October 24).
  tracking?: { number: string; company: string | null; url: string | null } | null;
  messages?: { configured: boolean; items: Array<{ kind: string; state: string; dueAt: string; reason?: string | null }> };
};

export type CheckoutTransaction = {
  version: 1; id: string; state: string; orderId: string;
  acceptedAt: string; reconciledAt: string | null;
  // The accepted offer: one product (orders before whole-cart offers: priceCents, title, quantity)
  // or a whole cart (`version: 'cart-v1'`: every line and productSubtotalCents).
  agreement: { priceCents?: number; balanceCents: number; depositCents: number; terms: string;
    termsVersion: string; postingRequirements?: string; servicing?: { postingWindowDays: number };
    currency?: string; title?: string; variantTitle?: string; quantity?: number;
    version?: 'cart-v1'; productSubtotalCents?: number; lines?: CheckoutAgreementLine[] };
  consent: unknown;
  payment: { verified: boolean; reasons: string[]; orderName: string; currency: string;
    totalCents: number; paidCents: number; outstandingCents: number; authorizedCents: number; dueAt: string | null;
    // Items bought outside Post to Pay on the same order, with their tax: paid in full at checkout (October 14; absent before).
    otherItemsCents?: number;
    // A shipping charge on an order with ordinary items, and its tax: paid in full at checkout (October 14; absent before).
    shippingCents?: number; shippingTaxCents?: number;
    // Shipping and its tax Shopify left in the balance, until servicing makes it free (October 17; absent before).
    deferredShippingCents?: number;
    // Approved post: the cents (at most 5) the order ended below what was paid, refunded to the customer;
    // the part Shopify doesn't show refunded yet (October 14; absent before).
    roundingRefundCents?: number; roundingRefundDueCents?: number } | null;
  delivery: { deliveredAt: string | null }; postingDeadlineAt: string | null;
  servicing: ServicingStatus | null; postDetectedAt: string | null;
  outcome: 'waived' | 'collected' | null; outcomeObservedAt: string | null;
  decision?: { kind: 'approved' | 'missed'; recordedAt: string } | null;
  settlement?: { state: string; message?: string; checkedAt?: string } | null;
  // Set once the brand (or Vouch) cancelled the order in Shopify before shipment.
  cancellation?: { requestedAt: string; source: 'merchant' | 'vouch' | null; by: string | null; reason: string | null } | null;
  // Set when the store removed Vouch before the order concluded: nothing more is payable (Terms 9.8).
  conclusion?: { at: string; reason: 'app_uninstalled' | null } | null;
  // Set when the shopper changed the Post to Pay items before checkout and the order was re-priced from what was bought.
  repricedAtOrder?: { at: string; savingCents: number | null } | null;
};
export type CheckoutAgreementLine = { title: string; variantTitle: string; quantity: number; lineSubtotalCents: number };
export type CheckoutDashboardRow = {
  id: string; brandId: string; username: string; shopDomain: string; createdAt: string;
  // photo: Vouch's saved copy of the creator's Instagram photo (a data URL); absent before the server sends it.
  // category: the creator's niche, Modash's main interest for them (October 24); absent until fetched.
  profile: { displayName: string | null; followers: number | null; engagement: number | null; photo?: string | null; category?: string | null };
  transaction: CheckoutTransaction;
};
