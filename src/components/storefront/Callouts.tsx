import { useEffect, useRef, useState } from 'react';
import type { SocialPlatform } from '@/types/vouch';
import { findProduct, money } from '@/lib/demoStore';
import { closeVouchPopup, openVouchPopup, useCart, usePillDismissed, usePopupRequest, useVouchAccount } from '@/lib/storeState';
import { useVouchSettings } from '@/lib/demoSettings';
import { cn } from '@/lib/utils';
import logoGradient from '@/assets/vouch-logo-gradient.svg';
import logoWhite from '@/assets/vouch-logo-white.svg';
import wordmarkWhite from '@/assets/vouch-wordmark-white.svg';
import { PlatformMark } from './platformMarks';
import { PLATFORMS, PLATFORM_ORDER, PostToPay } from './PostToPay';
import { SWAP_MS, usePlatformTick } from './platformCycle';
import './post-to-pay.css';

// Post to Pay's secondary callouts, from Figma ("Vouch Branding (Revamped)", Post to Pay page,
// Secondary callouts): optional ways for shoppers to spot Post to Pay without finding the button.
// Callouts inside the merchant's content use the theme's font and colors plus the Vouch logo;
// floating callouts and the popup use Vouch's styling. Each is switched on in the demo's settings.

/**
 * The platform name follows the button's icon on the shared clock: it fades out as the icon starts
 * to swap, changes at the swap's midpoint, and fades back in as the new icon lands.
 */
const FADE_MS = SWAP_MS / 2;

function useCyclingPlatform() {
  const tick = usePlatformTick();
  const [shown, setShown] = useState(tick);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (tick === shown) return;
    setVisible(false);
    const fade = setTimeout(() => {
      setShown(tick);
      setVisible(true);
    }, FADE_MS);
    return () => clearTimeout(fade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return { platform: PLATFORM_ORDER[shown % PLATFORM_ORDER.length], visible };
}

const LONGEST_NAME = PLATFORM_ORDER.map((id) => PLATFORMS[id].name).sort((a, b) => b.length - a.length)[0];

/**
 * "Up to 100% OFF if you post on Instagram vouch" under a price, like Shop Pay's installments line.
 * The whole line is the link: it turns periwinkle on hover, and opens the popup. After the shopper
 * qualifies it shows their discount and price instead.
 */
export function VouchLine({ priceCents, scope }: { priceCents: number; scope: string }) {
  const { account, percent } = useVouchAccount();
  const { platform, visible } = useCyclingPlatform();
  const names = PLATFORM_ORDER.map((id) => PLATFORMS[id].name).join(', ');

  return (
    <button
      type="button"
      onClick={() => openVouchPopup(scope)}
      className="group mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-left text-sm leading-5 text-[#121212] transition-colors hover:text-[#4a54e2] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a54e2]/40"
    >
      {account && percent !== null ? (
        <>
          <PlatformMark platform={account.platform} size={14} />
          <span><span className="font-medium">{percent}% OFF</span> unlocked: your price {money(Math.round(priceCents * (100 - percent) / 100))}</span>
        </>
      ) : (
        <span className="inline-flex items-baseline gap-1">
          <span>Up to 100% OFF if you post on</span>
          {/* A fixed slot as wide as the longest name, so nothing else moves as the names change. */}
          <span className="relative inline-block font-medium">
            <span className="invisible" aria-hidden="true">{LONGEST_NAME}</span>
            <span
              className="absolute left-0 top-0 whitespace-nowrap transition-opacity ease-in-out"
              style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
              aria-hidden="true"
            >
              {PLATFORMS[platform].name}
            </span>
            <span className="sr-only">{names}</span>
          </span>
        </span>
      )}
      <img src={logoGradient} alt="Vouch" className="h-3 w-auto" />
    </button>
  );
}

// The top-strip slide shows for one announcement-bar turn, so instead of joining the shared clock
// (which it would pick up mid-swap) it plays the same short sequence every time it appears: the
// first platform, one crossfade halfway through its turn, then the second (Henry, November 18).
const STRIP_PLATFORMS = PLATFORM_ORDER.slice(0, 2);
const STRIP_LONGEST = STRIP_PLATFORMS.map((id) => PLATFORMS[id].name).sort((a, b) => b.length - a.length)[0];

function useStripPlatform(durationMs: number) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The name finishes fading back in at the middle of the slide's turn.
    const out = setTimeout(() => setVisible(false), durationMs / 2 - FADE_MS);
    const swap = setTimeout(() => {
      setIndex(1);
      setVisible(true);
    }, durationMs / 2);
    return () => { clearTimeout(out); clearTimeout(swap); };
  }, [durationMs]);
  return { platform: STRIP_PLATFORMS[index], visible };
}

/**
 * The top-strip slide: one slide in the store's announcement bar, in the bar's colors and font. The
 * name sits in a fixed slot as wide as the longer name, so the centered line doesn't move.
 */
export function TopStripSlide({ scope, tone = 'dark', durationMs }: { scope: string; tone?: 'dark' | 'light'; durationMs: number }) {
  const { platform, visible } = useStripPlatform(durationMs);
  return (
    <button type="button" onClick={() => openVouchPopup(scope)} className="inline-flex items-center gap-1.5 hover:underline">
      <span>
        Up to 100% OFF if you post about your purchase on{' '}
        <span className="relative inline-block text-left font-medium">
          <span className="invisible" aria-hidden="true">{STRIP_LONGEST}</span>
          <span
            className="absolute left-0 top-0 whitespace-nowrap transition-opacity ease-in-out"
            style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
          >
            {PLATFORMS[platform].name}
          </span>
        </span>
      </span>
      {/* White on a dark bar, the gradient logo on a light one, as in Figma. */}
      <img src={tone === 'dark' ? logoWhite : logoGradient} alt="Vouch" className="h-[11px] w-auto" />
      <span aria-hidden="true">→</span>
    </button>
  );
}

/**
 * Sits with the footer's payment logos at the same 38 × 24 size. Figma's updated badge (Secondary
 * callouts, "Badge / Gradient"): the Post to Pay gradient with the white wordmark alone, no icon, so
 * the word is bigger and easier to read this small.
 */
export function FooterBadge() {
  return (
    <span
      className="grid h-6 w-[38px] place-items-center overflow-hidden rounded-[3px] bg-[linear-gradient(147.7deg,#4a54e2,#2330d4)]"
      title="Post to Pay by Vouch"
    >
      <img src={wordmarkWhite} alt="Vouch" width={30.5} height={8.637} className="block h-[8.637px] w-[30.5px]" />
    </span>
  );
}

/** For qualified shoppers, on every page until dismissed. Bottom center; tapping opens the panel. */
export function UnlockedPill() {
  const [settings] = useVouchSettings();
  const { account, percent } = useVouchAccount();
  const [dismissed, setDismissed] = usePillDismissed();
  const popup = usePopupRequest();
  if (!settings.unlockedPill || !account || percent === null || dismissed || popup) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#d4dee9] bg-white py-1 pl-1 pr-1 font-sans shadow-[0_12px_32px_rgba(6,27,49,0.16)] animate-fade-in">
        <button type="button" onClick={() => openVouchPopup('order', true)} className="flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-1 text-sm font-medium text-[#061b31] hover:text-[#4a54e2]">
          <PlatformMark platform={account.platform} size={18} />
          {percent}% off with Post to Pay
        </button>
        <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-[#64748d] hover:bg-[#f8fafd] hover:text-[#061b31]">×</button>
      </div>
    </div>
  );
}

const MAX_NAME = 30;

/**
 * The Post to Pay popup. Step 1 asks the question and shows the platforms; picking one opens the
 * panel at Enter username, then the usual flow. From a product page it names the product; from the
 * cart line, the top strip or the pill it covers the order (one row per cart item in the result).
 */
export function VouchPopup() {
  const request = usePopupRequest();
  const cart = useCart();
  const [platform, setPlatform] = useState<SocialPlatform | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlatform(null);
    if (!request) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeVouchPopup();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [request]);

  if (!request) return null;

  const [kind, handle, variantId] = request.scope.split(':');
  const product = kind === 'product' ? findProduct(handle) : undefined;
  const placement = product ? 'product' : 'cart';
  const priceCents = product ? product.priceCents : cart.subtotalCents;
  const subject = product ? (product.title.length > MAX_NAME ? 'this' : `your ${product.title}`) : 'your order';
  const lines = product ? undefined : cart.items.flatMap(({ product: item, line }) => Array.from({ length: line.quantity }, () => ({ label: item.title, cents: item.priceCents })));
  const showPanel = request.panel || platform !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#061b31]/40 font-sans sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && closeVouchPopup()}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Post to Pay"
        className="max-h-[92%] w-full overflow-y-auto rounded-t-lg border border-[#d4dee9] bg-white shadow-[0_12px_32px_rgba(6,27,49,0.16)] outline-none animate-fade-in sm:max-h-[90vh] sm:w-[400px] sm:rounded-lg"
      >
        {showPanel ? (
          <PostToPay
            key={`${request.at}-${platform}`}
            placement={placement}
            priceCents={priceCents}
            item={product ? { handle: product.handle, variantId: variantId ?? product.variants[0].id } : undefined}
            lines={lines}
            embedded={{ step: request.panel ? 'approval' : 'username', platform: platform ?? undefined, onClose: closeVouchPopup }}
          />
        ) : (
          <div className="vouch-proof vouch-proof--embedded">
            <header className="vouch-proof__header">
              <img className="vouch-proof__logo" src={logoGradient} alt="Vouch" width={84} height={18} />
              <button type="button" aria-label="Close" onClick={closeVouchPopup}>×</button>
            </header>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-xl font-semibold leading-7 text-[#061b31]">Pay for {subject} with a social media post?</h2>
                <p className="text-sm text-[#64748d]">Earn up to 100% off for one post.</p>
              </div>
              <p className="text-xs font-semibold leading-4 text-[#273951]">Pick your platform to see your discount</p>
              <PlatformRow onPick={setPlatform} />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748d]">Terms apply</span>
                <button type="button" onClick={closeVouchPopup} className="font-medium text-[#4a54e2] hover:underline">No thanks, I’ll pay full price</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** More than three platforms: the row scrolls, with an arrow and a fade at the edge. */
function PlatformRow({ onPick }: { onPick: (platform: SocialPlatform) => void }) {
  const row = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const update = () => {
    const el = row.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  return (
    <div className="relative">
      <div ref={row} onScroll={update} className="flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PLATFORM_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-lg border border-[#d4dee9] bg-white px-2 py-3.5 text-sm font-semibold text-[#50617a] transition-colors hover:border-[#4a54e2] hover:bg-[#f4f6fd] hover:text-[#061b31]"
          >
            <span className="grid h-9 w-9 place-items-center"><PlatformMark platform={id} size={22} /></span>
            {PLATFORMS[id].name}
          </button>
        ))}
      </div>
      <div className={cn('pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity', atEnd && 'opacity-0')}>
        <button
          type="button"
          aria-label="More platforms"
          onClick={() => row.current?.scrollBy({ left: 224, behavior: 'smooth' })}
          className="pointer-events-auto grid h-7 w-7 place-items-center rounded-full border border-[#d4dee9] bg-white text-[#50617a] shadow-sm hover:text-[#061b31]"
        >
          ›
        </button>
      </div>
    </div>
  );
}
