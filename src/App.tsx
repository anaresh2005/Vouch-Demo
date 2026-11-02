import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
import { Storefront } from "@/components/storefront/Storefront";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import Roadmap from "./pages/Roadmap";
import NotFound from "./pages/NotFound";

// The store alone, as framed by the demo's mobile preview: ?page=cart or ?page=checkout picks the page.
function FramedStore() {
  const [params] = useSearchParams();
  const page = params.get('page');
  return <Storefront page={page === 'cart' || page === 'checkout' ? page : 'product'} />;
}

const App = () => (
  <DemoAuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/checkout" element={<Demo />} />
        {/* The bare store, framed by the demo's mobile preview. */}
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/checkout/store" element={<FramedStore />} />
        {/* The dashboard was removed from the demo (November 2026); old links land on the shopper demo. */}
        <Route path="/dashboard/*" element={<Navigate to="/checkout" replace />} />
        <Route path="/demo" element={<Navigate to="/" replace />} />
        <Route path="/beta" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </DemoAuthProvider>
);

export default App;
