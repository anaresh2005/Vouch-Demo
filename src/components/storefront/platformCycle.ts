import { useSyncExternalStore } from 'react';

// One clock for every place that cycles through the platforms (the button's icon, the line under the
// price, the top strip), so they always show the same platform and change at the same moment.
// Henry's timing, November 15: hold 2.5 s, swap 450 ms. The clock counts from a fixed point in time,
// so the store in the phone frame stays in step too. Reduced motion holds the first platform.
export const HOLD_MS = 2500;
export const SWAP_MS = 450;
const CYCLE_MS = HOLD_MS + SWAP_MS;

const now = () => Math.floor(Date.now() / CYCLE_MS);
const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

let tick = now();
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function schedule() {
  timer = setTimeout(() => {
    tick = now();
    listeners.forEach((listener) => listener());
    schedule();
  }, CYCLE_MS - (Date.now() % CYCLE_MS) + 5);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick = now();
    schedule();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearTimeout(timer);
  };
}

const still = () => () => {};

/** A number that goes up by one each time the platforms change; use `tick % count` for the platform. */
export function usePlatformTick(): number {
  const reduced = reducedMotion();
  return useSyncExternalStore(reduced ? still : subscribe, () => (reduced ? 0 : tick));
}
