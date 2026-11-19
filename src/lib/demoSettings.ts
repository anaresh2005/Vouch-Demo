import { useDemoState, writeState } from './demoState';

// Where Vouch appears in the demo store. The groups follow the Post to Pay page in Figma ("Vouch
// Branding (Revamped)": the button, then Secondary callouts). Defaults (Henry, November 18, 2026):
// everything is on except the social-app popup. The thank-you page block is left out of the demo
// for now.
export interface VouchSettings {
  buttonProduct: boolean;
  buttonCart: boolean;
  buttonCheckout: boolean;
  priceLine: boolean;
  cartTotalLine: boolean;
  footerBadge: boolean;
  topStrip: boolean;
  unlockedPill: boolean;
  socialPopup: boolean;
}

export type VouchSetting = keyof VouchSettings;

export const DEFAULT_SETTINGS: VouchSettings = {
  buttonProduct: true,
  buttonCart: true,
  buttonCheckout: true,
  priceLine: true,
  cartTotalLine: true,
  footerBadge: true,
  topStrip: true,
  unlockedPill: true,
  socialPopup: false,
};

export const SETTING_GROUPS: { title: string; items: { key: VouchSetting; label: string; hint: string }[] }[] = [
  {
    title: 'Post to Pay button',
    items: [
      { key: 'buttonProduct', label: 'Product pages', hint: 'Under Add to cart and Buy it now' },
      { key: 'buttonCart', label: 'Cart', hint: 'Under Check out' },
      { key: 'buttonCheckout', label: 'Checkout', hint: 'One of the express payment tiles' },
    ],
  },
  {
    title: 'Product and cart pages',
    items: [
      { key: 'priceLine', label: 'Line under the price', hint: 'Names each platform in turn; opens the popup' },
      { key: 'cartTotalLine', label: 'Line under the cart total', hint: 'Between the total and Check out' },
    ],
  },
  {
    title: 'Site-wide',
    items: [
      { key: 'footerBadge', label: 'Footer badge', hint: 'Next to the payment logos' },
      { key: 'topStrip', label: 'Top-strip slide', hint: 'A slide in the announcement bar' },
    ],
  },
  {
    title: 'Floating',
    items: [
      { key: 'unlockedPill', label: 'Unlocked pill', hint: 'After the shopper qualifies, on every page' },
      { key: 'socialPopup', label: 'Visitor from a social app', hint: 'Popup on a product page when they engage or start to leave' },
    ],
  },
];

const SETTINGS_KEY = 'settings';

export function useVouchSettings() {
  const [stored, setStored] = useDemoState<Partial<VouchSettings>>(SETTINGS_KEY, EMPTY);
  const settings: VouchSettings = { ...DEFAULT_SETTINGS, ...stored };
  const set = (key: VouchSetting, value: boolean) => setStored((current) => ({ ...current, [key]: value }));
  return [settings, set] as const;
}

const EMPTY: Partial<VouchSettings> = {};

/** Asks the store (here or in the phone frame) to show the social-app popup now. */
export function showSocialPopupNow() {
  writeState('popup-request', Date.now());
}
