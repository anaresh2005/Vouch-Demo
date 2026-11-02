import { useState, type ReactNode } from 'react';
import { BatteryFull, ChevronDown, Monitor, ShoppingBag, ShoppingCart, Signal, Smartphone, Wifi, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Storefront, type StorePage } from '@/components/storefront/Storefront';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import logo from '@/assets/vouch-logo-periwinkle.png';

type ViewMode = 'desktop' | 'mobile';

// What the demo leaves out, listed so investors know it exists (Henry, November 2, 2026).
const NOT_SHOWN = [
  {
    title: 'Subscriptions',
    description:
      'Shoppers pay a monthly, quarterly or annual plan with a post. Before each renewal charge they can choose to post instead of paying.',
  },
  {
    title: 'Content feed for brand websites',
    description:
      'A live page or section on the brand’s site that shows the latest and best-performing Vouch posts, and invites customers to join in.',
  },
  {
    title: 'Influencer discovery',
    description:
      'A model trained on each brand’s own Vouch shoppers recommends creators beyond its natural traffic who match its best performers. Brands reach out to them from the dashboard.',
  },
  {
    title: 'Influencer relationship management',
    description:
      'Regift top performers for sales and holidays. AI agents over text and email suggest content ideas, guide creators through posting, answer questions and hand out affiliate codes.',
  },
  {
    title: 'Merchant dashboard',
    description:
      'A timeline of every Vouch order. Brands open each order’s post and charges, track return on investment from Shopify sales, set who can Vouch, and see each creator’s audience and their creators’ audience overall.',
  },
];

export default function Demo() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [page, setPage] = useState<StorePage>('product');
  const isMobile = useIsMobile();
  // On a phone the demo is already the mobile experience, so there's no preview frame.
  const showFrame = viewMode === 'mobile' && !isMobile;

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-30 bg-card shadow-[inset_0_-1px_0_hsl(var(--divider))]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-2 px-4">
          <img src={logo} alt="Vouch" className="h-5 w-auto" />
          <span className="hidden text-sm text-muted-foreground lg:inline">Shopper demo</span>
          <div className="ml-auto flex items-center gap-2">
            {/* Post to Pay appears on product pages and (roadmap) the cart page. */}
            <Segmented<StorePage>
              label="Page"
              value={page}
              onChange={setPage}
              options={[['product', ShoppingBag, 'Product page', 'Product'], ['cart', ShoppingCart, 'Cart page', 'Cart']]}
            />
            {!isMobile && (
              <Segmented<ViewMode>
                label="Device"
                value={viewMode}
                onChange={setViewMode}
                options={[['desktop', Monitor, 'Desktop', 'Desktop'], ['mobile', Smartphone, 'Mobile', 'Mobile']]}
              />
            )}
            <Popover>
              <PopoverTrigger className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold text-secondary-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                <span className="hidden sm:inline">Not in this demo</span>
                <span className="sm:hidden">Roadmap</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(380px,calc(100vw-32px))] p-0">
                <p className="px-4 pb-2 pt-3 text-xs font-semibold text-muted-foreground">On the roadmap, not shown in this demo</p>
                <ul className="max-h-[70vh] divide-y divide-divider overflow-y-auto">
                  {NOT_SHOWN.map((item) => (
                    <li key={item.title} className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
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
        <main className="flex-1">
          <Storefront key={page} page={page} />
        </main>
      )}
    </div>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, LucideIcon, string, string])[];
}) {
  return (
    <div className="flex rounded-md bg-secondary p-0.5 shadow-edge" role="group" aria-label={label}>
      {options.map(([option, Icon, text, short]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-sm font-medium transition-colors',
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
