import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
import { Storefront } from "@/components/storefront/Storefront";
import Auth from "./pages/Auth";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

const App = () => (
  <DemoAuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/checkout" element={<Demo />} />
        {/* The bare store, framed by the demo's mobile preview. */}
        <Route path="/checkout/store" element={<Storefront />} />
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
