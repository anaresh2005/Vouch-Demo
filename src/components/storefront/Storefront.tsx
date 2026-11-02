import { useState } from 'react';
import { Menu, Search, ShoppingBag, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoProduct, demoStore, money } from '@/lib/demoStore';
import { PostToPay } from './PostToPay';

export type StorePage = 'product' | 'cart';

// A plain merchant store in the style of Shopify's default theme, so Post to Pay is seen where it
// sits: below the product page's buy buttons, or below the cart's checkout button (roadmap). The
// theme follows Post to Pay's default look (6px corners, 16px semibold Inter on buttons) so the
// button sits naturally in it. Only Post to Pay is interactive.
const BUTTON = 'h-12 w-full rounded-md text-base font-semibold';

export function Storefront({ page = 'product' }: { page?: StorePage }) {
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
