import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoStore, findProduct, money } from '@/lib/demoStore';
import { useVouchSettings } from '@/lib/demoSettings';
import { readState, useDemoState } from '@/lib/demoState';
import { openVouchPopup, useCart } from '@/lib/storeState';
import americanExpress from '@/assets/payment/american_express.svg';
import applePay from '@/assets/payment/apple_pay.svg';
import googlePay from '@/assets/payment/google_pay.svg';
import mastercard from '@/assets/payment/master.svg';
import paypal from '@/assets/payment/paypal.svg';
import shopPay from '@/assets/payment/shopify_pay.svg';
import visa from '@/assets/payment/visa.svg';
import { FooterBadge, TopStripSlide, UnlockedPill, VouchPopup } from './Callouts';
import { AboutPage, CartPage, CheckoutPage, CollectionPage, FaqPage, HomePage, ProductPage } from './StorePages';

// Harbor & Pine, a fictional store in the style of Shopify's default theme, so Post to Pay is seen
// where it sits in a real store. Browsing, the cart and quantities work; payment doesn't (the card
// form is disabled, and Post to Pay stops where the live product hands off to Shopify checkout).
// The theme follows Post to Pay's default look (6px corners, 16px semibold Inter on buttons).

const StoreBase = createContext('/store');

/** A path inside the store, under wherever it's mounted (the demo page or the phone frame). */
export function useStorePath() {
  const base = useContext(StoreBase);
  return useCallback((path = '') => `${base}${path ? `/${path}` : ''}`, [base]);
}

export function Storefront({ base }: { base: string }) {
  return (
    <StoreBase.Provider value={base}>
      <Routes>
        <Route path="checkout" element={<CheckoutPage />} />
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<CollectionPage />} />
          <Route path="collections/:collection" element={<CollectionPage />} />
          <Route path="products/:handle" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
      <VouchPopup />
      <UnlockedPill />
      <SocialPopupTrigger />
      <ScrollToTop />
    </StoreBase.Provider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NAV: [string, string][] = [['shop', 'Shop all'], ['collections/bottles', 'Bottles'], ['collections/accessories', 'Accessories'], ['about', 'About'], ['faq', 'FAQ']];

function StoreLayout() {
  const path = useStorePath();
  // In the phone frame the store has the screen to itself, so its header sticks; on the demo page the demo's header does.
  const framed = useContext(StoreBase).startsWith('/frame');
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-full flex-col bg-white font-sans text-[#121212]">
      <AnnouncementBar />
      <header className={cn('z-30 border-b border-[#e8e8e8] bg-white', framed && 'sticky top-0')}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 md:px-8">
          <button type="button" className="-ml-1 p-1 md:hidden" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to={path()} className="text-lg font-semibold tracking-tight max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2">{demoStore.name}</Link>
          <nav className="ml-8 hidden gap-6 text-sm text-[#121212]/75 md:flex" aria-label="Store">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={path(to)} className={({ isActive }) => cn('underline-offset-4 hover:text-[#121212] hover:underline', isActive && 'text-[#121212] underline')}>{label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Search className="h-5 w-5 max-md:hidden" aria-hidden="true" />
            <Link to={path('cart')} className="relative p-1" aria-label={`Cart, ${cart.count} ${cart.count === 1 ? 'item' : 'items'}`}>
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {cart.count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#121212] px-1 text-[11px] font-semibold text-white">{cart.count}</span>
              )}
            </Link>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#e8e8e8] px-4 py-2 md:hidden" aria-label="Store">
            {NAV.map(([to, label]) => (
              <Link key={to} to={path(to)} className="block py-3 text-base">{label}</Link>
            ))}
          </nav>
        )}
      </header>
      <div className="flex-1"><Outlet /></div>
      <Footer />
    </div>
  );
}

const SLIDE_MS = 5000;

/** The theme's announcement bar: slides rotate; Vouch's top-strip slide is one of them when it's on. */
function AnnouncementBar() {
  const [settings] = useVouchSettings();
  const { handle } = useParams();
  const product = findProduct(useLocation().pathname.match(/products\/([^/]+)/)?.[1] ?? handle);
  const slides: ReactNode[] = [
    <span key="ship">Free shipping on orders over {money(demoStore.freeShippingOverCents)}</span>,
    ...(settings.topStrip ? [<TopStripSlide key="vouch" scope={product ? `product:${product.handle}` : 'order'} />] : []),
    <span key="new">New: the Travel Tumbler, in three colors</span>,
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    // With the Vouch slide just switched on, show it first so it's easy to find.
    setIndex(settings.topStrip ? 1 : 0);
    const timer = setInterval(() => setIndex((value) => value + 1), SLIDE_MS);
    return () => clearInterval(timer);
  }, [settings.topStrip]);

  return (
    <div className="bg-[#121212] px-4 py-2 text-center text-[13px] leading-5 text-white" aria-live="off">
      <div key={index % slides.length} className="animate-fade-in">{slides[index % slides.length]}</div>
    </div>
  );
}

// The payment icons Shopify themes show in the footer (Shopify's open-source payment_icons set, 38 × 24),
// in the order a store lists them; the Vouch badge sits at the end at the same size.
const PAYMENT_LOGOS: [string, string][] = [
  ['American Express', americanExpress],
  ['Apple Pay', applePay],
  ['Google Pay', googlePay],
  ['Mastercard', mastercard],
  ['PayPal', paypal],
  ['Shop Pay', shopPay],
  ['Visa', visa],
];

function Footer() {
  const path = useStorePath();
  const [settings] = useVouchSettings();
  return (
    <footer className="mt-16 bg-[#121212] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.4fr] md:px-8">
        <div>
          <p className="text-lg font-semibold">{demoStore.name}</p>
          <p className="mt-2 max-w-[260px] text-sm text-white/60">{demoStore.tagline}. Made to be carried, refilled and handed down.</p>
        </div>
        <FooterColumn title="Shop" links={[['collections/bottles', 'Bottles'], ['collections/accessories', 'Accessories'], ['shop', 'Shop all']]} />
        <FooterColumn title="Help" links={[['faq', 'Shipping & returns'], ['faq', 'Care guide'], ['about', 'Our story']]} />
        <div>
          <p className="text-sm font-semibold">Join the list</p>
          <p className="mt-2 text-sm text-white/60">New colors and restocks, about once a month.</p>
          <div className="mt-3 flex h-11 overflow-hidden rounded-md border border-white/30">
            <input disabled aria-label="Email" placeholder="Email" className="min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-white/50" />
            <span className="grid place-items-center px-3 text-white/50" aria-hidden="true">→</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <p className="text-xs text-[#bdbdbd]">© 2026, {demoStore.name} · A fictional store for the Vouch demo</p>
          <ul className="flex flex-wrap items-center gap-2" aria-label="Payment methods">
            {PAYMENT_LOGOS.map(([name, src]) => (
              <li key={name}><img src={src} alt={name} width={38} height={24} className="block h-6 w-[38px]" /></li>
            ))}
            {settings.footerBadge && <li><Link to={path('faq#post-to-pay')}><FooterBadge /></Link></li>}
          </ul>
        </div>
      </div>
      <Link to={path()} className="sr-only">Home</Link>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  const path = useStorePath();
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-white/60">
        {links.map(([to, label]) => <li key={label}><Link to={path(to)} className="hover:text-white">{label}</Link></li>)}
      </ul>
    </div>
  );
}

const ENGAGE_MS = 8000;

/**
 * The popup for visitors from a social app: on a product page, once they engage (a few seconds on
 * the page) or start to leave (the pointer heads for the tabs). Once per visit. The demo's settings
 * can also show it on demand.
 */
function SocialPopupTrigger() {
  const [settings] = useVouchSettings();
  const [shown, setShown] = useDemoState<boolean>('social-popup-shown', false);
  const [requestedAt] = useDemoState<number>('popup-request', 0);
  const mountedAt = useRef(Date.now());
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const path = useStorePath();
  const handle = pathname.match(/products\/([^/]+)/)?.[1];

  // "Show it now" from the settings: open on this product, or go to the best seller first.
  useEffect(() => {
    if (!requestedAt || requestedAt < mountedAt.current) return;
    mountedAt.current = Date.now();
    if (handle) openVouchPopup(`product:${handle}`);
    else {
      navigate(path('products/everyday-bottle'));
      setTimeout(() => openVouchPopup('product:everyday-bottle'), 50);
    }
  }, [requestedAt, handle, navigate, path]);

  useEffect(() => {
    if (!settings.socialPopup || shown || !handle) return;
    const show = () => {
      if (readState('social-popup-shown', false)) return;
      setShown(true);
      openVouchPopup(`product:${handle}`);
    };
    const timer = setTimeout(show, ENGAGE_MS);
    const onLeave = (event: MouseEvent) => { if (event.clientY <= 0) show(); };
    document.addEventListener('mouseout', onLeave);
    return () => { clearTimeout(timer); document.removeEventListener('mouseout', onLeave); };
  }, [settings.socialPopup, shown, handle, setShown]);

  return null;
}
