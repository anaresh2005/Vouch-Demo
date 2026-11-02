import bottleSlate from '@/assets/bottle-slate.jpg';
import bottleSand from '@/assets/bottle-sand.jpg';
import bottleSage from '@/assets/bottle-sage.jpg';

// A fictional merchant for the investor demo. Renders were generated for the demo (November 2026).
export const demoStore = {
  name: 'Harbor & Pine',
  /** The brand's handle, the same on every platform. */
  handle: 'harborandpine',
  /** Days after delivery to post, as in the merchant's Vouch settings. */
  postingWindowDays: 3,
  freeExpressShipping: true,
};

export interface Variant {
  id: string;
  name: string;
  image: string;
  swatch: string;
}

export const demoProduct = {
  title: 'Everyday Bottle',
  subtitle: 'Insulated stainless steel · 20 oz',
  priceCents: 4200,
  description:
    'Double-walled stainless steel keeps drinks cold for 24 hours or hot for 12. A powder-coated finish that won’t sweat, and a leakproof steel cap.',
  variants: [
    { id: 'slate', name: 'Slate', image: bottleSlate, swatch: '#6f8396' },
    { id: 'sand', name: 'Sand', image: bottleSand, swatch: '#d9cbb5' },
    { id: 'sage', name: 'Sage', image: bottleSage, swatch: '#a9b8a2' },
  ] satisfies Variant[],
};

export function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
