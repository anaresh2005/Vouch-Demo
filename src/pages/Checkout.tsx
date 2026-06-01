import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CheckoutContent } from '@/components/checkout/CheckoutContent';
import { MobilePreviewFrame } from '@/components/checkout/MobilePreviewFrame';
import { ViewModeToggle, ViewMode } from '@/components/checkout/ViewModeToggle';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Checkout() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const isMobile = useIsMobile();

  // On actual mobile devices, always show desktop mode (no preview needed)
  const showMobilePreview = viewMode === 'mobile' && !isMobile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#e0e0e0] flex items-center justify-center">
              <span className="text-[#333333] font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-foreground text-lg">StyleCo</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Only show toggle on non-mobile devices */}
            {!isMobile && (
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            )}
            
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      {showMobilePreview ? (
        <MobilePreviewFrame />
      ) : (
        <CheckoutContent />
      )}
    </div>
  );
}
