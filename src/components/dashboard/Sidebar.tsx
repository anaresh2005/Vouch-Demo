import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  Users,
  Gift,
  BarChart3,
  Camera,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoBlackFull from '@/assets/logo-black-full.png';
import logoWhiteFull from '@/assets/logo-white-full.png';
import iconBlack from '@/assets/icon-black.png';
import iconWhite from '@/assets/icon-white.png';
import { useTheme } from 'next-themes';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, tourId: 'overview' },
  { href: '/dashboard/orders', label: 'Gifts', icon: Gift, tourId: 'gifts' },
  { href: '/dashboard/posts', label: 'Posts', icon: Camera, tourId: 'posts' },
  { href: '/dashboard/influencers', label: 'Influencers', icon: Users, tourId: 'influencers' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, tourId: 'analytics' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, tourId: 'settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { demoLogout } = useDemoAuth();
  const { resolvedTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    setIsSigningOut(true);
    demoLogout();
    navigate('/', { replace: true });
    setIsSigningOut(false);
  };

  // Use black logo/icon for light mode, white logo/icon for dark mode
  // Only switch after mounted to prevent hydration mismatch
  const isDark = mounted && resolvedTheme === 'dark';
  const logoSrc = isDark ? logoWhiteFull : logoBlackFull;
  const iconSrc = isDark ? iconWhite : iconBlack;

  return (
    <aside
      className={cn(
        'h-screen fixed left-0 top-0 bg-gradient-to-b from-card/80 via-card/50 to-primary/[0.08] dark:from-card/40 dark:via-card/25 dark:to-primary/[0.06] flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={cn('py-5', collapsed ? 'px-1 flex justify-center' : 'px-6')}>
        <Link to="/dashboard" className="flex items-center">
          {collapsed ? (
            <img src={iconSrc} alt="Vouch" className="w-5 h-5" />
          ) : (
            <img src={logoSrc} alt="Vouch" className="h-8" />
          )}
        </Link>
      </div>

      <nav className={cn('flex-1 space-y-0.5', collapsed ? 'p-1' : 'px-2 py-3')}>
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              data-tour-nav={item.tourId}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-md text-[13px] font-medium transition-colors duration-150 font-body',
                collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2',
                isActive
                  ? 'text-foreground bg-muted/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {/* Linear-style left active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
              )}
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Faint brand watermark gradient at bottom */}
      <div className="mt-auto px-3 pb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </div>
      <div className={cn('p-4', collapsed && 'p-2')}>
        <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
          {collapsed ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="text-muted-foreground hover:bg-transparent dark:hover:text-primary hover:text-warning"
                title="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-muted-foreground hover:bg-transparent hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-muted-foreground hover:bg-transparent hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="text-muted-foreground hover:bg-transparent dark:hover:text-primary hover:text-warning"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
