import { useSyncExternalStore } from 'react';
import type { AccountStats, SocialPlatform } from '@/types/vouch';
import { lineDetails, STARTER_CART, type CartLine } from './demoStore';
import { useDemoState } from './demoState';
import { DEMO_FULL_DISCOUNT_FOLLOWERS, demoDiscountPercent } from './postToPayDiscount';

// The demo store's shared state: the cart, and the shopper's Post to Pay result (their account
// and discount), which the button, the lines, the pill and the popup all read.

export function useCart() {
  const [lines, setLines] = useDemoState<CartLine[]>('cart', STARTER_CART);
  const items = lines.map((line) => ({ line, ...lineDetails(line)! })).filter((item) => item.product);
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  const add = (handle: string, variantId: string, quantity = 1) => setLines((current) => {
    const existing = current.find((line) => line.handle === handle && line.variantId === variantId);
    return existing
      ? current.map((line) => (line === existing ? { ...line, quantity: line.quantity + quantity } : line))
      : [...current, { handle, variantId, quantity }];
  });
  const setQuantity = (handle: string, variantId: string, quantity: number) => setLines((current) => (
    quantity <= 0
      ? current.filter((line) => !(line.handle === handle && line.variantId === variantId))
      : current.map((line) => (line.handle === handle && line.variantId === variantId ? { ...line, quantity } : line))
  ));

  return { lines, items, subtotalCents, count, add, setQuantity };
}

export interface VouchAccount {
  platform: SocialPlatform;
  username: string;
  /** Null for platforms the demo doesn't scan. */
  stats: AccountStats | null;
}

/** The account the shopper checked in the panel, shared by every Vouch surface in the store. */
export function useVouchAccount() {
  const [account, setAccount] = useDemoState<VouchAccount | null>('account', null);
  const percent = account ? demoDiscountPercent(account.stats?.followers ?? DEMO_FULL_DISCOUNT_FOLLOWERS) : null;
  return { account, percent, setAccount };
}

export function usePillDismissed() {
  return useDemoState<boolean>('pill-dismissed', false);
}

/** Opens the Post to Pay popup. `scope` is a product handle, or 'order' for the whole cart. */
export interface PopupRequest {
  scope: string;
  /** Start at the panel (skipping the popup's platform row), as the pill does. */
  panel?: boolean;
  at: number;
}

// The open popup belongs to this page only (not shared storage), so a reload or the other view
// never reopens it.
let popup: PopupRequest | null = null;
const popupListeners = new Set<() => void>();

export function openVouchPopup(scope: string, panel = false) {
  popup = { scope, panel, at: Date.now() };
  popupListeners.forEach((listener) => listener());
}

export function closeVouchPopup() {
  popup = null;
  popupListeners.forEach((listener) => listener());
}

export function usePopupRequest() {
  return useSyncExternalStore(
    (listener) => { popupListeners.add(listener); return () => popupListeners.delete(listener); },
    () => popup,
    () => null,
  );
}
