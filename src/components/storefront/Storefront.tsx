import { useState } from 'react';
import { Menu, Search, ShoppingBag, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoProduct, demoStore, money } from '@/lib/demoStore';
import { PostToPay } from './PostToPay';

// A plain merchant product page in the style of Shopify's default theme, so Post to Pay is seen
// where it really sits: below the theme's buy buttons. Only Post to Pay is interactive.
export function Storefront() {
  const [variant, setVariant] = useState(demoProduct.variants[0]);

  return (
    <div className="min-h-full bg-white font-sans text-[#121212]">
      <div className="bg-[#121212] py-2 text-center text-xs tracking-wide text-white">Free shipping on orders over $50</div>
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

      <main className="mx-auto grid max-w-[1120px] gap-6 px-4 py-6 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-8 md:py-10">
        <div className="space-y-3">
          <img src={variant.image} alt={`${demoProduct.title} in ${variant.name}`} className="aspect-square w-full rounded-sm object-cover" />
          <div className="grid grid-cols-3 gap-3">
            {demoProduct.variants.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVariant(item)}
                className={cn('overflow-hidden rounded-sm ring-1 ring-[#e8e8e8]', item.id === variant.id && 'ring-2 ring-[#121212]')}
                aria-label={`Show ${item.name}`}
              >
                <img src={item.image} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="md:max-w-[440px]">
          <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">{demoStore.name}</p>
          <h1 className="mt-2 text-3xl font-normal tracking-tight text-[#121212] md:text-4xl">{demoProduct.title}</h1>
          <p className="mt-1 text-sm text-[#121212]/60">{demoProduct.subtitle}</p>
          <p className="mt-4 text-lg">{money(demoProduct.priceCents)} USD</p>
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
                    'flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
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
            <div className="mt-2 inline-flex h-11 items-center gap-6 border border-[#121212]/30 px-4" aria-label="Quantity 1">
              <Minus className="h-3.5 w-3.5 text-[#121212]/40" aria-hidden="true" />
              <span className="text-sm">1</span>
              <Plus className="h-3.5 w-3.5 text-[#121212]/40" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button type="button" className="h-12 w-full border border-[#121212] text-sm tracking-wide">Add to cart</button>
            <button type="button" className="h-12 w-full bg-[#121212] text-sm tracking-wide text-white">Buy it now</button>
          </div>

          <PostToPay productTitle={demoProduct.title} variant={variant} priceCents={demoProduct.priceCents} />

          <p className="mt-6 text-sm leading-6 text-[#121212]/75">{demoProduct.description}</p>
        </div>
      </main>
    </div>
  );
}
