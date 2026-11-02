import { useState, type ReactNode } from 'react';
import { BatteryFull, CreditCard, Map, Monitor, ShoppingBag, ShoppingCart, Signal, Smartphone, Wifi, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Storefront, type StorePage } from '@/components/storefront/Storefront';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import logo from '@/assets/vouch-logo-periwinkle.png';

type ViewMode = 'desktop' | 'mobile';

export default function Demo() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [page, setPage] = useState<StorePage>('product');
  const isMobile = useIsMobile();
  // On a phone the demo is already the mobile experience, so there's no preview frame.
  const showFrame = viewMode === 'mobile' && !isMobile;

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-30 bg-card shadow-[inset_0_-1px_0_hsl(var(--divider))]">
        <div className="mx-auto flex min-h-14 max-w-[1120px] flex-wrap items-center gap-2 px-4 py-2.5">
          <img src={logo} alt="Vouch" className="h-5 w-auto" />
          <span className="hidden text-sm text-muted-foreground lg:inline">Shopper demo</span>
          {/* On phones the page switch takes its own row under the logo. */}
          <div className="ml-auto flex items-center gap-2 max-sm:contents">
            {/* Post to Pay appears on product pages and (roadmap) the cart and checkout pages. */}
            <Segmented<StorePage>
              className="max-sm:order-last max-sm:w-full"
              label="Page"
              value={page}
              onChange={setPage}
              options={[['product', ShoppingBag, 'Product page', 'Product'], ['cart', ShoppingCart, 'Cart page', 'Cart'], ['checkout', CreditCard, 'Checkout', 'Checkout']]}
            />
            {!isMobile && (
              <Segmented<ViewMode>
                label="Device"
                value={viewMode}
                onChange={setViewMode}
                options={[['desktop', Monitor, 'Desktop', 'Desktop'], ['mobile', Smartphone, 'Mobile', 'Mobile']]}
              />
            )}
            <Link
              to="/roadmap"
              className="flex h-8 max-sm:ml-auto items-center gap-1.5 whitespace-nowrap rounded-md bg-card px-2.5 text-sm font-semibold text-secondary-foreground shadow-edge hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              Roadmap
            </Link>
          </div>
        </div>
      </header>

      {showFrame ? (
        <main className="flex flex-1 items-start justify-center py-8">
          <Phone>
            {/* A real 375px viewport, so the store's own mobile layout applies. */}
            <iframe key={page} src={`/checkout/store?page=${page}`} title="Shopper demo on mobile" className="block h-[765px] w-[375px] border-0" />
          </Phone>
        </main>
      ) : (
        <main className="flex-1 bg-white">
          <Storefront key={page} page={page} />
        </main>
      )}
    </div>
  );
}

function Segmented<T extends string>({ label, value, onChange, options, className }: {
  label: string;
  className?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, LucideIcon, string, string])[];
}) {
  return (
    <div className={cn('flex rounded-md bg-secondary p-0.5 shadow-edge', className)} role="group" aria-label={label}>
      {options.map(([option, Icon, text, short]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-7 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-2.5 text-sm font-medium transition-colors',
            value === option ? 'bg-card text-foreground shadow-edge' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">{text}</span>
          <span className="xl:hidden">{short}</span>
        </button>
      ))}
    </div>
  );
}

// A phone drawn in CSS (sharp at any screen density): a 375 × 812 screen with a status bar.
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-[60px] bg-[#1b1b1f] p-3 shadow-[0_0_0_1px_#3a3a40]">
      <span className="absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#2a2a2e]" aria-hidden="true" />
      <span className="absolute -left-[3px] top-[176px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" aria-hidden="true" />
      <span className="absolute -left-[3px] top-[244px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" aria-hidden="true" />
      <span className="absolute -right-[3px] top-[200px] h-20 w-[3px] rounded-r bg-[#2a2a2e]" aria-hidden="true" />
      <div className="flex h-[812px] w-[375px] flex-col overflow-hidden rounded-[48px] bg-[#121212]">
        <div className="relative flex h-[47px] shrink-0 items-center justify-between px-8 text-[15px] font-semibold text-white" aria-hidden="true">
          <span>9:41</span>
          <span className="absolute left-1/2 top-[11px] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1.5">
            <Signal className="h-4 w-4" />
            <Wifi className="h-4 w-4" />
            <BatteryFull className="h-5 w-5" />
          </span>
        </div>
        <div className="flex-1 bg-white">{children}</div>
      </div>
    </div>
  );
}
