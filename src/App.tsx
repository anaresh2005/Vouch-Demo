import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TimeframeProvider } from "@/hooks/useTimeframe";
import { TourProvider } from "@/hooks/useTour";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Overview from "./pages/dashboard/Overview";
import Orders from "./pages/dashboard/Orders";
import Influencers from "./pages/dashboard/Influencers";
import Posts from "./pages/dashboard/Posts";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <DemoAuthProvider>
        <TimeframeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <TourProvider>
                <TourOverlay />
                <Routes>
                  <Route path="/" element={<Auth />} />
                  <Route path="/demo" element={<Navigate to="/" replace />} />
                  <Route path="/beta" element={<Navigate to="/" replace />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
                  <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/dashboard/influencers" element={<ProtectedRoute><Influencers /></ProtectedRoute>} />
                  <Route path="/dashboard/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                  <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TourProvider>
            </BrowserRouter>
          </TooltipProvider>
        </TimeframeProvider>
      </DemoAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
