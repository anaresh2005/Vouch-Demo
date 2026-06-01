import { ShoppingBag } from 'lucide-react';
import { MockPaymentMethods } from '@/components/checkout/MockPaymentMethods';
import { VouchCheckoutInline } from '@/components/checkout/VouchCheckoutInline';
import { mockCartItems, mockBrand, calculateCartTotal } from '@/lib/checkoutMockData';

export function CheckoutContent() {
  const cartTotal = calculateCartTotal(mockCartItems);

  return (
    <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="grid md:grid-cols-2 gap-4 sm:gap-8 md:items-start">
        {/* Cart Summary */}
        <div className="space-y-4 sm:space-y-6">
          <div className="md:hidden">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Complete your order from {mockBrand.name}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
            <h2 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              Order Summary
            </h2>

            <div className="space-y-2 sm:space-y-3">
              {mockCartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-[#e0e0e0] overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground flex-shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">Free</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base sm:text-lg pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">${(cartTotal * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 sm:space-y-6">
          <div className="md:hidden">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Payment Method</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Choose how you'd like to pay
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <MockPaymentMethods />
            <VouchCheckoutInline brand={mockBrand} orderTotal={cartTotal * 1.08} />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Traditional payment methods are disabled in this demo
          </p>
        </div>
      </div>
    </main>
  );
}
