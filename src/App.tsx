import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DemoAuthProvider, useDemoAuth } from "@/hooks/useDemoAuth";
import { Storefront } from "@/components/storefront/Storefront";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import Roadmap from "./pages/Roadmap";
import NotFound from "./pages/NotFound";

// The store alone, as framed by the demo's mobile preview. It tells the demo page where the shopper
// is, so switching back to Desktop stays on the same page.
function FramedStore() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    window.parent?.postMessage({ type: "vouch-frame-path", path: pathname.replace(/^\/frame/, "") + hash }, location.origin);
  }, [pathname, hash]);
  return <Storefront base="/frame/store" />;
}

// Every demo page asks for the password first. It's remembered for the tab (sessionStorage), so it's
// entered once: after that the store, the dashboard and the roadmap open without asking again.
// Opening a page directly goes to the password page and then back to that page.
function RequirePassword({ children }: { children: ReactNode }) {
  const { isDemoAuthenticated, loading } = useDemoAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isDemoAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname + location.search + location.hash }} />;
  return <>{children}</>;
}

const App = () => (
  <DemoAuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/store/*" element={<RequirePassword><Demo view="store" /></RequirePassword>} />
        <Route path="/dashboard/*" element={<RequirePassword><Demo view="dashboard" /></RequirePassword>} />
        <Route path="/frame/store/*" element={<RequirePassword><FramedStore /></RequirePassword>} />
        <Route path="/roadmap" element={<RequirePassword><Roadmap /></RequirePassword>} />
        {/* Older links: the demo used to live at /checkout. */}
        <Route path="/checkout/*" element={<Navigate to="/store" replace />} />
        <Route path="/demo" element={<Navigate to="/" replace />} />
        <Route path="/beta" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </DemoAuthProvider>
);

export default App;
