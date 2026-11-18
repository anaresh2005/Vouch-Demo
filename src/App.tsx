import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
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

const App = () => (
  <DemoAuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/store/*" element={<Demo view="store" />} />
        <Route path="/dashboard/*" element={<Demo view="dashboard" />} />
        <Route path="/frame/store/*" element={<FramedStore />} />
        <Route path="/roadmap" element={<Roadmap />} />
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
