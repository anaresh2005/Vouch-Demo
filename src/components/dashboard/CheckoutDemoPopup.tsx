import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CheckoutDemoPopup() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div data-tour="checkout-demo" className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg flex items-center gap-3 pl-4 pr-2 py-2">
        <span className="text-sm font-medium text-foreground">Try the checkout demo</span>
        <Link to="/checkout">
          <Button size="sm" className="vouch-gradient text-white hover:opacity-90 gap-1.5 h-8">
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Button>
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
