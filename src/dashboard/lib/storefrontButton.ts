import type { Brand } from '@dashboard/types/vouch';

// How Post to Pay appears on the brand's store. The limits match the database checks in
// 20261006090000_storefront_button.sql, which still allow 'checkout': the Checkout box was removed
// (owner decision, October 12), so a saved 'checkout' is ignored and dropped on the next save.
export type ButtonPage = 'product' | 'cart';
export type ButtonText = 'white' | 'black';
export type ButtonCorners = 'theme' | 'square' | 'slight' | 'rounded' | 'pill' | 'custom';
export type ButtonSize = 'standard' | 'medium' | 'compact';
export type StorefrontButton = {
  accepting_orders: boolean;
  button_pages: ButtonPage[];
  button_color: string;
  button_text: ButtonText;
  button_corners: ButtonCorners;
  /** Exact corner size in pixels for 'custom'; null otherwise. While being typed, an empty box is NaN. */
  button_radius: number | null;
  button_size: ButtonSize;
};

// The cart page box is kept for whole-cart offers, which aren't built (owner decision, October 12).
export const BUTTON_PAGES: { value: ButtonPage; label: string; note?: string }[] = [
  { value: 'product', label: 'Product pages' },
  { value: 'cart', label: 'Cart page', note: 'Not available yet.' },
];

/** The pages in BUTTON_PAGES order without repeats, leaving out any the card no longer offers. */
export const knownPages = (pages: readonly string[]) => BUTTON_PAGES.map(p => p.value).filter(page => pages.includes(page));

// Corner sizes the storefront should use for each choice; 'theme' follows the theme's own buttons.
export const BUTTON_CORNERS: { value: ButtonCorners; label: string; radius: string | null }[] = [
  { value: 'theme', label: "Match my theme's buttons", radius: null },
  { value: 'square', label: 'Square', radius: '0px' },
  { value: 'slight', label: 'Slightly rounded', radius: '4px' },
  { value: 'rounded', label: 'Rounded', radius: '8px' },
  { value: 'pill', label: 'Pill', radius: '9999px' },
  { value: 'custom', label: 'Custom', radius: null },
];

export const MAX_RADIUS = 50;

// Fixed sizes rather than a slider, so every store's button keeps a tested height, label and icon
// (Henry, October 8, after Crave'n Cups asked for a smaller button). Mirrors post-to-pay.css.
export const BUTTON_SIZES: { value: ButtonSize; label: string; height: number; fontSize: number; icon: number; width: string; tagline: number; note: string }[] = [
  { value: 'standard', label: 'Standard', height: 48, fontSize: 16, icon: 20, width: '100%', tagline: 11, note: 'full width and 48px tall' },
  { value: 'medium', label: 'Medium', height: 40, fontSize: 15, icon: 18, width: '100%', tagline: 10.5, note: 'full width and 40px tall' },
  { value: 'compact', label: 'Compact', height: 36, fontSize: 14, icon: 16, width: '66%', tagline: 9, note: 'two-thirds width, centered, and 36px tall' },
];
export const buttonSize = (size: ButtonSize) => BUTTON_SIZES.find(s => s.value === size) ?? BUTTON_SIZES[0];

export const VOUCH_COLOR = '#4A54E2';
export const TEXT_COLORS: Record<ButtonText, string> = { white: '#FFFFFF', black: '#000000' };

export const buttonFromBrand = (brand: Brand): StorefrontButton => ({
  accepting_orders: brand.accepting_orders,
  button_pages: knownPages(brand.button_pages),
  button_color: brand.button_color,
  button_text: brand.button_text as ButtonText,
  button_corners: brand.button_corners as ButtonCorners,
  button_radius: brand.button_radius,
  button_size: brand.button_size as ButtonSize,
});

/** "#4a54e2", "4A54E2" or "#abc" as stored ("#4A54E2"), or null when it isn't a hex colour. */
export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) return `#${[...hex].map(c => c + c).join('')}`.toUpperCase();
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}`.toUpperCase() : null;
}

// WCAG relative luminance and contrast ratio.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** True when the chosen text is hard to read on the button colour (under 3:1, the limit for large bold text). */
export const textHardToRead = (hex: string, text: ButtonText) => contrast(hex, TEXT_COLORS[text]) < 3;

/** The checkout panel's Vouch logo: Vouch's periwinkle with Vouch's colour, black once a brand picks its own. */
export const usesVouchColor = (hex: string) => normalizeHex(hex) === VOUCH_COLOR;

/** True when the colour is too light for links, outlines and progress bars on white (under 3:1). */
export const hardToSeeOnWhite = (hex: string) => contrast(hex, '#FFFFFF') < 3;

/** Returns a message describing the first problem, or null when the settings can be saved. */
export function validateButton(button: StorefrontButton): string | null {
  if (button.button_pages.length === 0) return 'Choose at least one page for the Post to Pay button.';
  if (!normalizeHex(button.button_color)) return 'Enter a colour as a hex code, for example #4A54E2.';
  if (button.button_corners === 'custom'
    && !(Number.isInteger(button.button_radius) && button.button_radius! >= 0 && button.button_radius! <= MAX_RADIUS)) {
    return `Enter custom corners as a whole number of pixels from 0 to ${MAX_RADIUS}.`;
  }
  if (!BUTTON_SIZES.some(s => s.value === button.button_size)) return 'Choose a button size.';
  return null;
}

/** As stored: the colour in "#RRGGBB" and the pages in a fixed order without repeats. */
export const tidyButton = (button: StorefrontButton): StorefrontButton => ({
  ...button,
  button_color: normalizeHex(button.button_color) ?? button.button_color,
  button_pages: knownPages(button.button_pages),
  button_radius: button.button_corners === 'custom' ? button.button_radius : null,
});

/** The corner size the storefront button uses, or null to follow the theme. */
export const cornerRadius = (button: Pick<StorefrontButton, 'button_corners' | 'button_radius'>) => button.button_corners === 'custom'
  ? (Number.isFinite(button.button_radius) ? `${button.button_radius}px` : null)
  : BUTTON_CORNERS.find(c => c.value === button.button_corners)?.radius ?? null;

export const sameButton = (a: StorefrontButton, b: StorefrontButton) =>
  a.accepting_orders === b.accepting_orders && a.button_color === b.button_color && a.button_text === b.button_text
  && a.button_corners === b.button_corners && a.button_size === b.button_size
  && Object.is(a.button_radius, b.button_radius)
  && a.button_pages.join() === b.button_pages.join();
