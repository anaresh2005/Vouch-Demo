import { useCallback, useSyncExternalStore } from 'react';

// Shared demo state (cart, Vouch settings, the shopper's Post to Pay result) kept in sessionStorage,
// so the demo page and the phone frame (a same-origin iframe in the same tab) see the same values.
// A change in one document reaches the other through the `storage` event; changes in the same
// document go through a local event. Every read and write tolerates storage being unavailable.

const PREFIX = 'vouch-demo:';
const LOCAL_EVENT = 'vouch-demo-state';

const memory = new Map<string, string>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function readState<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeState<T>(key: string, value: T | null) {
  const raw = value === null ? null : JSON.stringify(value);
  try {
    if (raw === null) sessionStorage.removeItem(PREFIX + key);
    else sessionStorage.setItem(PREFIX + key, raw);
  } catch {
    if (raw === null) memory.delete(key);
    else memory.set(key, raw);
  }
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: key }));
}

/** Clears every demo key (cart, settings, Post to Pay result). */
export function resetDemoState() {
  try {
    Object.keys(sessionStorage).filter((key) => key.startsWith(PREFIX)).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    memory.clear();
  }
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: '*' }));
  // The phone frame shares sessionStorage but gets no event for removals in every browser, so tell it.
  document.querySelectorAll('iframe').forEach((frame) => frame.contentWindow?.postMessage({ type: 'vouch-demo-reset' }, location.origin));
}

function subscribe(callback: () => void) {
  const onMessage = (event: MessageEvent) => {
    if (event.origin === location.origin && event.data?.type === 'vouch-demo-reset') callback();
  };
  window.addEventListener('storage', callback);
  window.addEventListener(LOCAL_EVENT, callback);
  window.addEventListener('message', onMessage);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCAL_EVENT, callback);
    window.removeEventListener('message', onMessage);
  };
}

/** A piece of shared demo state and its setter. `fallback` must be a stable value (a constant). */
export function useDemoState<T>(key: string, fallback: T): [T, (next: T | ((current: T) => T)) => void] {
  const value = useSyncExternalStore(subscribe, () => readState(key, fallback), () => fallback);
  const set = useCallback((next: T | ((current: T) => T)) => {
    const current = readState(key, fallback);
    writeState(key, typeof next === 'function' ? (next as (current: T) => T)(current) : next);
  }, [key, fallback]);
  return [value, set];
}
