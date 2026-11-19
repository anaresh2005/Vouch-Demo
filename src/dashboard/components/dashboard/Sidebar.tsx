import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Camera, ChevronsUpDown, Gift, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';
import { cn } from '@dashboard/lib/utils';
import { useAuth } from '@dashboard/hooks/useAuth';
import { useSignOut } from '@dashboard/hooks/useSignOut';
import { useBrand, useBrandProfile } from '@dashboard/hooks/useBrandData';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@dashboard/components/ui/dropdown-menu';
import { Skeleton } from '@dashboard/components/ui/skeleton';
import iconPeriwinkle from '@dashboard/assets/vouch-icon-periwinkle.svg';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, tourId: 'overview' },
  { href: '/dashboard/orders', label: 'Gifts', icon: Gift, tourId: 'gifts' },
  { href: '/dashboard/posts', label: 'Posts', icon: Camera, tourId: 'posts' },
  { href: '/dashboard/influencers', label: 'Creators', icon: Users, tourId: 'influencers' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, tourId: 'analytics' },
];
const settingsItem = { href: '/dashboard/settings', label: 'Settings', icon: Settings, tourId: 'settings' };

type NavItem = typeof settingsItem;

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      data-tour-nav={item.tourId}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-[30px] items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-accent',
        active ? 'font-medium text-primary' : 'font-medium text-foreground',
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
      {item.label}
    </Link>
  );
}

// The brand at the top of the sidebar doubles as the account menu, as in Stripe.
function AccountMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { signOut, signingOut } = useSignOut();
  const { profile } = useBrandProfile();
  const { brand, isLoading } = useBrand();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
        <img src={iconPeriwinkle} alt="" className="h-7 w-7 shrink-0 rounded-md" />
        <span className="min-w-0 flex-1">
          {isLoading ? <Skeleton className="h-3.5 w-24" /> : <span className="block truncate text-sm font-medium text-foreground">{brand?.name ?? 'Vouch'}</span>}
          <span className="block truncate text-xs text-muted-foreground">{profile?.full_name ?? user?.email}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium text-foreground">{profile?.full_name ?? 'Signed in'}</span>
          <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/dashboard/settings')}><Settings className="h-4 w-4 text-muted-foreground" />Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()} disabled={signingOut}><LogOut className="h-4 w-4 text-muted-foreground" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The navigation column: brand and account menu, the main pages, and Settings pinned at the bottom. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-3 py-3">
      <AccountMenu />
      <nav aria-label="Main" className="mt-5 flex-1 space-y-0.5">
        {navItems.map(item => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
      </nav>
      <nav aria-label="Settings" className="pt-3 shadow-[inset_0_1px_0_hsl(var(--divider))]">
        <NavLink item={settingsItem} onNavigate={onNavigate} />
      </nav>
    </div>
  );
}
