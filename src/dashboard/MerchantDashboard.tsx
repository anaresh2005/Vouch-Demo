import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@dashboard/components/ui/toaster';
import { Toaster as Sonner } from '@dashboard/components/ui/sonner';
import { TooltipProvider } from '@dashboard/components/ui/tooltip';
import { AuthProvider } from '@dashboard/components/providers/AuthProvider';
import { TimeframeProvider } from '@dashboard/components/providers/TimeframeProvider';
import Overview from '@dashboard/pages/dashboard/Overview';
import Orders from '@dashboard/pages/dashboard/Orders';
import Influencers from '@dashboard/pages/dashboard/Influencers';
import Posts from '@dashboard/pages/dashboard/Posts';
import Analytics from '@dashboard/pages/dashboard/Analytics';
import Settings from '@dashboard/pages/dashboard/Settings';
import './dashboard.css';

// The merchant dashboard, copied from Vouch-MVP-Production (henry/creator-profile-cache, the newest
// dashboard work, November 2026) and restyled to the App UI Guidelines in Figma ("Vouch Branding
// (Revamped)"), ahead of the product. It runs on the production design preview's sample data
// (preview/), signed in as Harbor & Pine's owner, and is read-only: any save shows one "This is a
// demo" message. Routes match the product's, under the demo's /dashboard.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

export default function MerchantDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimeframeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="vouch-dashboard">
              <Routes>
                <Route index element={<Overview />} />
                <Route path="orders" element={<Orders />} />
                <Route path="influencers" element={<Influencers />} />
                <Route path="posts" element={<Posts />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Overview />} />
              </Routes>
            </div>
            {/* Shown on every screen so the sample data is never mistaken for a real store's. */}
            <p className="pointer-events-none fixed bottom-3 right-3 z-[60] whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-float">
              Sample data · read-only
            </p>
          </TooltipProvider>
        </TimeframeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
