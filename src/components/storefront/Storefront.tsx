import { useState } from 'react';
import { Menu, Search, ShoppingBag, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoProduct, demoStore, money } from '@/lib/demoStore';
import { PostToPay } from './PostToPay';

export type StorePage = 'product' | 'cart' | 'checkout';

// A plain merchant store in the style of Shopify's default theme, so Post to Pay is seen where it
// sits: below the product page's buy buttons, or (roadmap) below the cart's checkout button and with
// the express payment options at checkout. The
// theme follows Post to Pay's default look (6px corners, 16px semibold Inter on buttons) so the
// button sits naturally in it. Only Post to Pay is interactive.
const BUTTON = 'h-12 w-full rounded-md text-base font-semibold';

export function Storefront({ page = 'product' }: { page?: StorePage }) {
  if (page === 'checkout') return <CheckoutPage />;
  return (
    <div className="min-h-full bg-white font-sans text-[#121212]">
      <div className="bg-[#121212] py-2 text-center text-xs text-white">Free shipping on orders over $50</div>
      <header className="border-b border-[#e8e8e8]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-4 md:px-8">
          <Menu className="h-5 w-5 md:hidden" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">{demoStore.name}</span>
          <nav className="ml-8 hidden gap-6 text-sm text-[#121212]/75 md:flex" aria-label="Store">
            <span>Shop</span><span>Bottles</span><span>Accessories</span><span>About</span>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Search className="h-5 w-5" aria-hidden="true" />
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </header>
      {page === 'product' ? <ProductPage /> : <CartPage />}
    </div>
  );
}

function ProductPage() {
  const [variant, setVariant] = useState(demoProduct.variants[0]);

  return (
    <main className="mx-auto grid max-w-[1120px] gap-6 px-4 py-6 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-8 md:py-10">
      <div className="space-y-3">
        <img src={variant.image} alt={`${demoProduct.title} in ${variant.name}`} className="aspect-square w-full rounded-md object-cover" />
        <div className="grid grid-cols-3 gap-3">
          {demoProduct.variants.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setVariant(item)}
              className={cn('overflow-hidden rounded-md ring-1 ring-[#e8e8e8]', item.id === variant.id && 'ring-2 ring-[#121212]')}
              aria-label={`Show ${item.name}`}
            >
              <img src={item.image} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="md:max-w-[440px]">
        <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">{demoStore.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#121212] md:text-4xl">{demoProduct.title}</h1>
        <p className="mt-1 text-sm text-[#121212]/60">{demoProduct.subtitle}</p>
        <p className="mt-4 text-lg font-medium">{money(demoProduct.priceCents)} USD</p>
        <p className="mt-1 text-xs text-[#121212]/60">Shipping calculated at checkout.</p>

        <fieldset className="mt-6">
          <legend className="text-sm">Color: <span className="text-[#121212]/70">{variant.name}</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {demoProduct.variants.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVariant(item)}
                aria-pressed={item.id === variant.id}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors',
                  item.id === variant.id ? 'border-[#121212] bg-[#121212] text-white' : 'border-[#121212]/30 hover:border-[#121212]',
                )}
              >
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: item.swatch }} aria-hidden="true" />
                {item.name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <p className="text-sm">Quantity</p>
          <Quantity />
        </div>

        <div className="mt-6 space-y-3">
          <button type="button" className={cn(BUTTON, 'border border-[#121212]')}>Add to cart</button>
          <button type="button" className={cn(BUTTON, 'bg-[#121212] text-white')}>Buy it now</button>
        </div>

        <PostToPay
          placement="product"
          summary={`${demoProduct.title} · ${variant.name} · Quantity 1`}
          priceCents={demoProduct.priceCents}
        />

        <p className="mt-6 text-sm leading-6 text-[#121212]/75">{demoProduct.description}</p>
      </div>
    </main>
  );
}

// A sample cart of two colourways, so the whole-cart offer covers more than one item.
const CART = [demoProduct.variants[0], demoProduct.variants[2]];

function CartPage() {
  const subtotal = demoProduct.priceCents * CART.length;

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-6 md:px-8 md:py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[#121212] md:text-4xl">Your cart</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_380px] md:gap-12">
        <ul className="divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]">
          {CART.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <img src={item.image} alt="" className="h-24 w-24 shrink-0 rounded-md object-cover" />
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-semibold">{demoProduct.title}</p>
                <p className="text-sm text-[#121212]/60">Color: {item.name}</p>
                <Quantity small />
              </div>
              <p className="font-medium">{money(demoProduct.priceCents)}</p>
            </li>
          ))}
        </ul>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-base">Estimated total</span>
            <span className="text-lg font-semibold">{money(subtotal)} USD</span>
          </div>
          <p className="mt-1 text-xs text-[#121212]/60">Taxes, discounts and shipping calculated at checkout.</p>
          <button type="button" className={cn(BUTTON, 'mt-5 bg-[#121212] text-white')}>Check out</button>
          <PostToPay placement="cart" summary={`${CART.length} items in your cart`} priceCents={subtotal} />
        </div>
      </div>
    </main>
  );
}

// Shopify-style checkout: express options, Post to Pay, then the card form. Only Post to Pay works;
// the card fields are disabled so nobody types real card details into the demo.
const SAMPLE_TAX_RATE = 0.08;

function CheckoutPage() {
  const subtotal = demoProduct.priceCents * CART.length;
  const tax = Math.round(subtotal * SAMPLE_TAX_RATE);

  return (
    <div className="min-h-full bg-white font-sans text-[#121212]">
      <header className="border-b border-[#e8e8e8]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center px-4 md:px-8">
          <span className="text-lg font-semibold tracking-tight">{demoStore.name}</span>
          <ShoppingBag className="ml-auto h-5 w-5 text-[#121212]/70" aria-hidden="true" />
        </div>
      </header>
      <div className="mx-auto grid max-w-[1120px] md:grid-cols-[1fr_400px]">
        <aside className="order-first border-b border-[#e8e8e8] bg-[#f5f5f5] px-4 py-6 md:order-last md:border-b-0 md:border-l md:px-8 md:py-10">
          <ul className="space-y-4">
            {CART.map((item) => (
              <li key={item.id} className="flex items-center gap-4">
                <span className="relative">
                  <img src={item.image} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-black/10" />
                  <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#121212]/70 text-xs text-white">1</span>
                </span>
                <span className="flex-1 text-sm"><span className="block font-semibold">{demoProduct.title}</span><span className="text-[#121212]/60">{item.name}</span></span>
                <span className="text-sm">{money(demoProduct.priceCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>Free</dd></div>
            <div className="flex justify-between"><dt>Estimated taxes</dt><dd>{money(tax)}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd><span className="mr-1 text-xs font-normal text-[#121212]/60">USD</span>{money(subtotal + tax)}</dd></div>
          </dl>
        </aside>

        <main className="px-4 py-6 md:px-8 md:py-10">
          <p className="text-center text-sm text-[#121212]/60">Express checkout</p>
          {/* Post to Pay is one of the express tiles, the same size as the others; its tagline and panel span the row. */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={cn(BUTTON, 'bg-[#5a31f4] text-white')}>Shop Pay</button>
            <button type="button" className={cn(BUTTON, 'bg-[#ffc439] text-[#003087]')}>PayPal</button>
            <button type="button" className={cn(BUTTON, 'bg-black text-white')}>G Pay</button>
            <PostToPay placement="checkout" summary={`${CART.length} items in your order`} priceCents={subtotal} />
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase text-[#121212]/50" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e8e8e8]" />or<span className="h-px flex-1 bg-[#e8e8e8]" />
          </div>

          <h2 className="text-xl font-semibold">Contact</h2>
          <MockField label="Email" className="mt-3" />
          <h2 className="mt-8 text-xl font-semibold">Payment</h2>
          <p className="mt-1 text-sm text-[#121212]/60">All transactions are secure and encrypted.</p>
          <div className="mt-3 overflow-hidden rounded-md border border-[#121212]/20">
            <div className="flex items-center gap-2 border-b border-[#121212]/20 bg-[#f5f5f5] px-4 py-3 text-sm font-semibold">
              <span className="h-4 w-4 rounded-full border-[5px] border-[#121212]" aria-hidden="true" />
              Credit card
            </div>
            <div className="grid grid-cols-2 gap-3 bg-[#fafafa] p-4">
              <MockField label="Card number" className="col-span-2" />
              <MockField label="Expiration date (MM / YY)" />
              <MockField label="Security code" />
              <MockField label="Name on card" className="col-span-2" />
            </div>
          </div>
          <button type="button" className={cn(BUTTON, 'mt-6 bg-[#121212] text-white')}>Pay now</button>
        </main>
      </div>
    </div>
  );
}

function MockField({ label, className }: { label: string; className?: string }) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      disabled
      className={cn('h-12 w-full rounded-md border border-[#121212]/20 bg-white px-3 text-sm placeholder:text-[#121212]/50', className)}
    />
  );
}

function Quantity({ small = false }: { small?: boolean }) {
  return (
    <div
      className={cn('inline-flex items-center gap-6 rounded-md border border-[#121212]/30 px-4', small ? 'mt-2 h-9 w-fit' : 'mt-2 h-11')}
      aria-label="Quantity 1"
    >
      <Minus className="h-3.5 w-3.5 text-[#121212]/40" aria-hidden="true" />
      <span className="text-sm">1</span>
      <Plus className="h-3.5 w-3.5 text-[#121212]/40" aria-hidden="true" />
    </div>
  );
}
