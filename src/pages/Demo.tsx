import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { BatteryFull, LayoutDashboard, Map, Monitor, Signal, Smartphone, Store, Wifi, type LucideIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Storefront } from '@/components/storefront/Storefront';
import { DemoLogo } from '@/components/DemoLogo';
import { SettingsMenu } from '@/components/SettingsMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const MerchantDashboard = lazy(() => import('@/dashboard/MerchantDashboard'));

type View = 'store' | 'dashboard';
type ViewMode = 'desktop' | 'mobile';

// The demo page: the Harbor & Pine store (where shoppers meet Post to Pay) or the merchant's
// dashboard, with Desktop and Mobile previews, the roadmap and the placement settings.
export default function Demo({ view }: { view: View }) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // On a phone the demo is already the mobile experience, so there's no preview frame.
  const showFrame = viewMode === 'mobile' && !isMobile;
  // Where each view was left, so switching back returns there.
  const lastPath = useRef<Record<View, string>>({ store: '/store', dashboard: '/dashboard' });
  lastPath.current[view] = pathname;

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-40 bg-card shadow-[inset_0_-1px_0_hsl(var(--divider))]">
        <div className="mx-auto flex min-h-14 max-w-[1280px] flex-wrap items-center gap-2 px-4 py-2.5">
          <Link to="/store" aria-label="Demo home"><DemoLogo /></Link>
          <div className="ml-auto flex items-center gap-2 max-sm:contents">
            <Segmented<View>
              className="max-sm:order-last max-sm:w-full"
              label="View"
              value={view}
              onChange={(next) => navigate(lastPath.current[next])}
              options={[['store', Store, 'Harbor & Pine store', 'Store'], ['dashboard', LayoutDashboard, 'Merchant dashboard', 'Dashboard']]}
            />
            {!isMobile && view === 'store' && (
              <Segmented<ViewMode>
                label="Device"
                value={viewMode}
                onChange={setViewMode}
                options={[['desktop', Monitor, 'Desktop', 'Desktop'], ['mobile', Smartphone, 'Mobile', 'Mobile']]}
              />
            )}
            <Link
              to="/roadmap"
              className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-card px-2.5 text-sm font-medium text-secondary-foreground shadow-edge hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 max-sm:ml-auto"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              Roadmap
            </Link>
            {view === 'store' && <SettingsMenu />}
          </div>
        </div>
      </header>

      {view === 'dashboard' ? (
        <main className="flex-1 bg-card">
          <Suspense fallback={null}><MerchantDashboard /></Suspense>
        </main>
      ) : showFrame ? (
        <main className="flex flex-1 items-start justify-center py-8">
          <Phone><StoreFrame /></Phone>
        </main>
      ) : (
        <main className="flex-1 bg-white">
          <Storefront base="/store" />
        </main>
      )}
    </div>
  );
}

// The store at a real 375px viewport, so its own mobile layout applies. It opens on the page the
// desktop view was showing, and as the shopper moves around inside it the demo's address follows.
function StoreFrame() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [src] = useState(`/frame${pathname}${hash}`);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === location.origin && event.data?.type === 'vouch-frame-path') navigate(event.data.path, { replace: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);
  return <iframe src={src} title="Harbor & Pine on mobile" className="block h-[765px] w-[375px] border-0" />;
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
