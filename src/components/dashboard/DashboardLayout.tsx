import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { CheckoutDemoPopup } from './CheckoutDemoPopup';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const handleToggle = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/[0.03]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggle} />
      <main className={cn(
        "p-5 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-56"
      )}>
        {children}
      </main>
      <CheckoutDemoPopup />
    </div>
  );
}
