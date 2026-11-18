import merchantTermsText from '@dashboard/content/legal/merchant-terms-2026-10-07.md?raw';
import privacyPolicyText from '@dashboard/content/legal/privacy-policy-2026-10-07.md?raw';
import postToPayTermsText from '@dashboard/content/legal/post-to-pay-terms-2026-10-07.md?raw';

// The current Merchant Terms. A new version needs a new file here and a new legal_documents
// row in a migration; the database refuses acceptance of text it does not hold.
export type LegalText = { version: string; text: string };
export const MERCHANT_TERMS: LegalText = { version: '2026-10-07', text: merchantTermsText };
export const PRIVACY_POLICY: LegalText = { version: '2026-10-07', text: privacyPolicyText };
// The shopper-facing Post to Pay Terms. The checkout shows the agreement version stored in
// vouch_checkout_agreements (published by migration as plain text); this file is its source
// and the public /post-to-pay-terms page. A new version needs a new file and a new migration.
export const POST_TO_PAY_TERMS: LegalText = { version: 'post-to-pay-2026-10-07', text: postToPayTermsText };

// The checkout displays agreement text without formatting, so drop the Markdown markers.
export function plainLegalText(markdown: string) {
  return markdown.replace(/\r\n/g, '\n').replace(/^###### /gm, '').replace(/\*\*/g, '').trim();
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
