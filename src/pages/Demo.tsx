import { useState } from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Storefront } from '@/components/storefront/Storefront';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import logo from '@/assets/vouch-logo-periwinkle.png';
import iphoneFrame from '@/assets/iphone-frame.png';

type ViewMode = 'desktop' | 'mobile';

// What the demo leaves out, listed so investors know it exists.
// TODO(Henry): add the roadmap features that won't be mocked in the demo.
const NOT_SHOWN = [
  {
    title: 'Merchant dashboard',
    description:
      'Where brands run Post to Pay: every order from checkout to post, each shopper’s creator profile, post review and flagging before the discount is final, and settings for discounts and where the button appears.',
  },
];

export default function Demo() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const isMobile = useIsMobile();
  // On a phone the demo is already the mobile experience, so there's no preview frame.
  const showFrame = viewMode === 'mobile' && !isMobile;

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-30 bg-card shadow-[inset_0_-1px_0_hsl(var(--divider))]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-4">
          <img src={logo} alt="Vouch" className="h-5 w-auto" />
          <span className="hidden text-sm text-muted-foreground sm:inline">Shopper demo</span>
          <div className="ml-auto flex items-center gap-2">
            {!isMobile && (
              <div className="flex rounded-md bg-secondary p-0.5 shadow-edge" role="group" aria-label="Device">
                {([['desktop', Monitor, 'Desktop'], ['mobile', Smartphone, 'Mobile']] as const).map(([mode, Icon, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors',
                      viewMode === mode ? 'bg-card text-foreground shadow-edge' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
            <Popover>
              <PopoverTrigger className="flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-semibold text-secondary-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                Not in this demo
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[340px] p-0">
                <ul className="divide-y divide-divider">
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
        <main className="flex flex-1 justify-center py-8">
          <div className="relative w-[400px]">
            <img src={iphoneFrame} alt="" className="pointer-events-none relative z-10 w-full select-none" draggable={false} />
            <div className="absolute flex flex-col overflow-hidden rounded-[48px] bg-white" style={{ top: '1.8%', left: '3.8%', width: '92.4%', height: '96.4%' }}>
              {/* Status bar under the notch, matching the store's announcement bar. */}
              <div className="h-[46px] shrink-0 bg-[#121212]" />
              {/* A real 375px viewport, so the store's own mobile layout applies. */}
              <iframe
                src="/checkout/store"
                title="Shopper demo on mobile"
                className="h-[755px] w-[375px] origin-top-left border-0"
                style={{ transform: 'scale(0.985)' }}
              />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1">
          <Storefront />
        </main>
      )}
    </div>
  );
}
