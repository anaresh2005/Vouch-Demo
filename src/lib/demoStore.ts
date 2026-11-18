// Product images: 3D renders made in code with three.js for the demo (November 2026), one per color,
// all in the same studio setup so they match. scripts/product-renders/ has the renderer.
const images = import.meta.glob<string>('../assets/products/*.jpg', { eager: true, import: 'default' });
const image = (name: string) => images[`../assets/products/${name}.jpg`];

// A fictional merchant for the demo. Everything here is made up: the brand, its story and its products.
export const demoStore = {
  name: 'Harbor & Pine',
  /** The brand's handle, the same on every platform. */
  handle: 'harborandpine',
  tagline: 'Gear for the long way round',
  /** Days after delivery to post, as in the merchant's Vouch settings. */
  postingWindowDays: 3,
  freeExpressShipping: true,
  /** The express rate the store waives on Post to Pay orders, shown on "You're in". */
  expressShippingCents: 2800,
  freeShippingOverCents: 5000,
};

export type Collection = 'bottles' | 'accessories';

export const COLLECTIONS: Record<Collection, { title: string; blurb: string }> = {
  bottles: { title: 'Bottles', blurb: 'Double-walled steel that keeps cold drinks cold for a full day.' },
  accessories: { title: 'Accessories', blurb: 'Lids, slings and spares that fit every Harbor & Pine bottle.' },
};

export interface Variant {
  id: string;
  name: string;
  swatch: string;
  image: string;
}

export interface Product {
  handle: string;
  title: string;
  subtitle: string;
  priceCents: number;
  collection: Collection;
  description: string;
  details: string[];
  variants: Variant[];
  badge?: string;
}

export const PRODUCTS: Product[] = [
  {
    handle: 'everyday-bottle',
    title: 'Everyday Bottle',
    subtitle: 'Insulated stainless steel · 20 oz',
    priceCents: 4200,
    collection: 'bottles',
    badge: 'Best seller',
    description:
      'Double-walled stainless steel keeps drinks cold for 24 hours or hot for 12. A powder-coated finish that won’t sweat, and a leakproof steel cap.',
    details: ['20 oz (590 ml)', '18/8 stainless steel, BPA-free', 'Fits most cup holders', 'Hand wash recommended'],
    variants: [
      { id: 'slate', name: 'Slate', image: image('bottle-slate'), swatch: '#6f8396' },
      { id: 'sand', name: 'Sand', image: image('bottle-sand'), swatch: '#d9cbb5' },
      { id: 'sage', name: 'Sage', image: image('bottle-sage'), swatch: '#a9b8a2' },
    ],
  },
  {
    handle: 'travel-tumbler',
    title: 'Travel Tumbler',
    subtitle: 'Insulated steel with a sliding lid · 16 oz',
    priceCents: 3600,
    collection: 'bottles',
    badge: 'New',
    description:
      'For the commute and the coffee line. A tapered tumbler that fits under most espresso machines, with a sliding lid that locks shut.',
    details: ['16 oz (470 ml)', 'Hot for 6 hours, cold for 18', 'Splash-proof sliding lid', 'Dishwasher-safe lid'],
    variants: [
      { id: 'sand', name: 'Sand', swatch: '#d9cbb5', image: image('tumbler-sand') },
      { id: 'slate', name: 'Slate', swatch: '#6f8396', image: image('tumbler-slate') },
      { id: 'pine', name: 'Pine', swatch: '#3f5a4c', image: image('tumbler-pine') },
    ],
  },
  {
    handle: 'insulated-lid',
    title: 'Insulated Lid',
    subtitle: 'Double-walled cap with a carry loop',
    priceCents: 1800,
    collection: 'accessories',
    description:
      'Swap the steel cap for an insulated one with a soft-touch loop that hooks onto a bag or a finger. Fits every Harbor & Pine bottle.',
    details: ['Fits all Harbor & Pine bottles', 'Leakproof silicone seal', 'Dishwasher safe'],
    variants: [
      { id: 'steel', name: 'Steel', swatch: '#b8bec6', image: image('lid-steel') },
      { id: 'black', name: 'Black', swatch: '#2b2f33', image: image('lid-black') },
    ],
  },
  {
    handle: 'carry-sling',
    title: 'Carry Sling',
    subtitle: 'Recycled webbing · adjustable strap',
    priceCents: 2400,
    collection: 'accessories',
    description:
      'A padded sleeve and a cross-body strap, so your bottle comes along on long walks without taking up a hand. Made from recycled polyester webbing.',
    details: ['Fits 16–24 oz bottles', 'Adjustable 30–52 in strap', '100% recycled polyester'],
    variants: [
      { id: 'sand', name: 'Sand', swatch: '#d9cbb5', image: image('sling-sand') },
      { id: 'slate', name: 'Slate', swatch: '#6f8396', image: image('sling-slate') },
    ],
  },
  {
    handle: 'straw-cap',
    title: 'Straw Cap',
    subtitle: 'Flip-up straw lid · spill-proof',
    priceCents: 1600,
    collection: 'accessories',
    description:
      'A flip-up straw for one-handed sipping at the desk or on the trail. The straw folds flat and seals when it’s down.',
    details: ['Fits all Harbor & Pine bottles', 'Two replacement straws included', 'Dishwasher safe'],
    variants: [{ id: 'sage', name: 'Sage', swatch: '#a9b8a2', image: image('straw-sage') }],
  },
  {
    handle: 'bottle-brush-kit',
    title: 'Bottle Brush Kit',
    subtitle: 'Three brushes for bottle, cap and straw',
    priceCents: 1200,
    collection: 'accessories',
    description:
      'A long bottle brush, a cap brush and a straw cleaner, with plant-based bristles and beechwood handles.',
    details: ['Beechwood handles', 'Plant-based bristles', 'Hangs to dry'],
    variants: [{ id: 'natural', name: 'Natural', swatch: '#c9a97c', image: image('brush-natural') }],
  },
];

export function findProduct(handle: string | undefined): Product | undefined {
  return PRODUCTS.find((product) => product.handle === handle);
}

export interface CartLine {
  handle: string;
  variantId: string;
  quantity: number;
}

/** The cart a new visitor starts with, so the cart and checkout pages have something on them. */
export const STARTER_CART: CartLine[] = [
  // The same three items as the cart in Figma's "Result, from the cart page" ($84.00).
  { handle: 'everyday-bottle', variantId: 'slate', quantity: 1 },
  { handle: 'insulated-lid', variantId: 'steel', quantity: 1 },
  { handle: 'carry-sling', variantId: 'sand', quantity: 1 },
];

export function lineDetails(line: CartLine) {
  const product = findProduct(line.handle);
  if (!product) return null;
  const variant = product.variants.find((item) => item.id === line.variantId) ?? product.variants[0];
  return { product, variant, totalCents: product.priceCents * line.quantity };
}

export function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
