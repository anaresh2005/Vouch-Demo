import { useRef, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { MockPaymentMethods } from '@/components/checkout/MockPaymentMethods';
import { VouchCheckoutInline } from '@/components/checkout/VouchCheckoutInline';
import { mockCartItems, mockBrand, calculateCartTotal } from '@/lib/checkoutMockData';

interface MobileCheckoutContentProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function MobileCheckoutContent({ scrollContainerRef }: MobileCheckoutContentProps) {
  const cartTotal = calculateCartTotal(mockCartItems);
  const vouchSectionRef = useRef<HTMLDivElement>(null);

  const handleVouchExpand = useCallback(() => {
    setTimeout(() => {
      if (scrollContainerRef?.current && vouchSectionRef.current) {
        const container = scrollContainerRef.current;
        const vouchElement = vouchSectionRef.current;
        const scrollTop = vouchElement.offsetTop * 0.79 - 80;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }, 100);
  }, [scrollContainerRef]);

  return (
    <main className="px-4 pt-14 py-5 pb-24">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete your order from {mockBrand.name}
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          Order Summary
        </h2>

        <div className="space-y-3">
          {mockCartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-foreground flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground">Free</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground">${(cartTotal * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">${(cartTotal * 1.08).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Payment Method</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose how you'd like to pay
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        <MockPaymentMethods />
        <div ref={vouchSectionRef}>
          <VouchCheckoutInline 
            brand={mockBrand} 
            orderTotal={cartTotal * 1.08} 
            onExpand={handleVouchExpand}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mb-4">
        Traditional payment methods are disabled in this demo
      </p>
    </main>
  );
}
