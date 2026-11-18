import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';
import { ShopifyReminder } from './ShopifyReminder';
import { SectionBoundary } from './SectionBoundary';
import { cn } from '@dashboard/lib/utils';
import logo from '@dashboard/assets/vouch-logo-periwinkle.svg';

// The dashboard frame fills the screen: any reminder banner across the top, a fixed 240px sidebar, and
// page content (which scrolls on its own) centered up to 1280px. On small screens the sidebar opens
// from a menu button.
export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);

  // Demo: below the demo's 57px header instead of the full screen.
  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-background">
      <ShopifyReminder />
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-60 shrink-0 bg-card shadow-[inset_-1px_0_0_hsl(var(--divider))] transition-[transform,visibility] duration-200 md:visible md:static md:translate-x-0',
            // Closed, the menu is invisible as well as off-screen, so keyboard and screen-reader users skip it.
            menuOpen ? 'translate-x-0' : 'invisible -translate-x-full',
          )}
        >
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"
            className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden">
            <X className="h-4 w-4" />
          </button>
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </aside>
        {menuOpen && <div className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <header className="flex h-14 items-center gap-3 px-4 shadow-[inset_0_-1px_0_hsl(var(--divider))] md:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="rounded-md p-1.5 text-foreground hover:bg-accent">
              <Menu className="h-5 w-5" />
            </button>
            <img src={logo} alt="Vouch" className="h-5 w-auto" />
          </header>
          <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-6 sm:px-8 md:pt-8">
            {/* Keyed by page so a failed page recovers when the merchant navigates away. */}
            <SectionBoundary key={pathname} title="Could not load this page" className="mt-10">{children}</SectionBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
