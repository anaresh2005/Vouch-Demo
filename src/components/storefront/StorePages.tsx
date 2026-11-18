import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Leaf, Minus, Plus, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTIONS, demoStore, findProduct, money, PRODUCTS, type Collection, type Product } from '@/lib/demoStore';
import { useVouchSettings } from '@/lib/demoSettings';
import { useCart } from '@/lib/storeState';
import { PostToPay } from './PostToPay';

const [bottleSlate, bottleSand, bottleSage] = PRODUCTS[0].variants.map((variant) => variant.image);
import { ProductArt } from './ProductArt';
import { VouchLine } from './Callouts';
import { useStorePath } from './Storefront';

// The store's pages. Copy and products are invented for the demo.
const BUTTON = 'h-12 w-full rounded-md text-base font-semibold transition-colors';
const PAGE = 'mx-auto max-w-[1200px] px-4 md:px-8';

export function HomePage() {
  const path = useStorePath();
  return (
    <main>
      <section className="bg-[#efe9df]">
        <div className={cn(PAGE, 'grid items-center gap-8 py-10 md:grid-cols-2 md:py-16')}>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">New season colors</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{demoStore.tagline}.</h1>
            <p className="mt-4 max-w-md text-base text-[#121212]/75">Steel bottles and the small things that go with them, built to outlast every trip you take them on.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={path('products/everyday-bottle')} className="inline-flex h-12 items-center rounded-md bg-[#121212] px-6 text-base font-semibold text-white hover:bg-[#121212]/85">Shop the Everyday Bottle</Link>
              <Link to={path('shop')} className="inline-flex h-12 items-center rounded-md border border-[#121212] px-6 text-base font-semibold hover:bg-white/60">Shop all</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[bottleSlate, bottleSand, bottleSage].map((image, index) => (
              <img key={image} src={image} alt="" className={cn('aspect-[3/4] w-full rounded-md object-cover', index === 1 && 'md:-translate-y-6')} />
            ))}
          </div>
        </div>
      </section>

      <section className={cn(PAGE, 'py-12')}>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Best sellers</h2>
          <Link to={path('shop')} className="text-sm underline underline-offset-4">View all</Link>
        </div>
        <ProductGrid products={PRODUCTS.slice(0, 4)} />
      </section>

      <section className={cn(PAGE, 'grid gap-6 border-y border-[#e8e8e8] py-10 md:grid-cols-3')}>
        {[
          [Truck, 'Free shipping over $50', 'Orders ship in one business day from Portland, Maine.'],
          [RefreshCw, '30-day returns', 'Not the right fit? Send it back unused for a full refund.'],
          [Leaf, 'Lifetime warranty', 'If the insulation ever fails, we’ll replace the bottle.'],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={title as string} className="flex gap-4">
              <I className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div><p className="font-semibold">{title as string}</p><p className="mt-1 text-sm text-[#121212]/65">{body as string}</p></div>
            </div>
          );
        })}
      </section>

      <section className={cn(PAGE, 'grid gap-8 py-12 md:grid-cols-2 md:items-center')}>
        <img src={bottleSand} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">Our story</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Started on a ferry, with a leaky bottle.</h2>
          <p className="mt-4 text-[#121212]/75">Harbor &amp; Pine began in 2019 when two friends got tired of replacing bottles that dented, sweated and leaked. Every piece we make is tested on the water and in the woods of Maine before it ships.</p>
          <Link to={path('about')} className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">Read more</Link>
        </div>
      </section>

      <section className={cn(PAGE, 'pb-4')}>
        <h2 className="text-2xl font-semibold tracking-tight">Shop by collection</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(Object.keys(COLLECTIONS) as Collection[]).map((id) => {
            const first = PRODUCTS.find((product) => product.collection === id)!;
            return (
              <Link key={id} to={path(`collections/${id}`)} className="group flex items-center gap-5 rounded-md bg-[#f5f5f5] p-4 hover:bg-[#efefef]">
                <ProductArt product={first} className="w-28 shrink-0 rounded-md" />
                <div><p className="text-lg font-semibold">{COLLECTIONS[id].title} →</p><p className="mt-1 text-sm text-[#121212]/65">{COLLECTIONS[id].blurb}</p></div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {products.map((product) => <li key={product.handle}><ProductCard product={product} /></li>)}
    </ul>
  );
}

function ProductCard({ product }: { product: Product }) {
  const path = useStorePath();
  return (
    <Link to={path(`products/${product.handle}`)} className="group block">
      <div className="relative overflow-hidden rounded-md">
        <ProductArt product={product} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {product.badge && <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{product.badge}</span>}
      </div>
      <p className="mt-3 font-semibold group-hover:underline">{product.title}</p>
      <p className="mt-0.5 text-sm text-[#121212]/70">{money(product.priceCents)}</p>
      {product.variants.length > 1 && (
        <div className="mt-2 flex gap-1.5" aria-label={`${product.variants.length} colors`}>
          {product.variants.map((variant) => <span key={variant.id} className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: variant.swatch }} />)}
        </div>
      )}
    </Link>
  );
}

export function CollectionPage() {
  const { collection } = useParams();
  const id = collection && collection in COLLECTIONS ? (collection as Collection) : null;
  const products = id ? PRODUCTS.filter((product) => product.collection === id) : PRODUCTS;
  return (
    <main className={cn(PAGE, 'py-8 md:py-12')}>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{id ? COLLECTIONS[id].title : 'Shop all'}</h1>
      <p className="mt-2 text-[#121212]/65">{id ? COLLECTIONS[id].blurb : 'Everything we make, from bottles to brushes.'}</p>
      <p className="mt-6 text-sm text-[#121212]/60">{products.length} products</p>
      <ProductGrid products={products} />
    </main>
  );
}

export function ProductPage() {
  const { handle } = useParams();
  const product = findProduct(handle) ?? PRODUCTS[0];
  const [settings] = useVouchSettings();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const navigate = useNavigate();
  const path = useStorePath();
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];

  useEffect(() => { setVariantId(product.variants[0].id); setQuantity(1); setAdded(false); }, [product]);

  const addToCart = () => {
    cart.add(product.handle, variant.id, quantity);
    setAdded(true);
  };

  return (
    <main className={cn(PAGE, 'py-6 md:py-10')}>
      <nav className="mb-4 text-xs text-[#121212]/60" aria-label="Breadcrumb">
        <Link to={path()} className="hover:underline">Home</Link> / <Link to={path(`collections/${product.collection}`)} className="hover:underline">{COLLECTIONS[product.collection].title}</Link>
      </nav>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className="space-y-3">
          <ProductArt product={product} variant={variant} className="rounded-md" />
          {product.variants.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {product.variants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVariantId(item.id)}
                  className={cn('overflow-hidden rounded-md ring-1 ring-[#e8e8e8]', item.id === variant.id && 'ring-2 ring-[#121212]')}
                  aria-label={`Show ${item.name}`}
                >
                  <ProductArt product={product} variant={item} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:max-w-[440px]">
          <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">{demoStore.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{product.title}</h1>
          <p className="mt-1 text-sm text-[#121212]/60">{product.subtitle}</p>
          <p className="mt-4 text-lg font-medium">{money(product.priceCents)} USD</p>
          {settings.priceLine && <VouchLine priceCents={product.priceCents} scope={`product:${product.handle}:${variant.id}`} />}
          <p className="mt-1 text-xs text-[#121212]/60">Shipping calculated at checkout.</p>

          {product.variants.length > 1 && (
            <fieldset className="mt-6">
              <legend className="text-sm">Color: <span className="text-[#121212]/70">{variant.name}</span></legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVariantId(item.id)}
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
          )}

          <div className="mt-6">
            <p className="text-sm">Quantity</p>
            <Quantity value={quantity} onChange={setQuantity} />
          </div>

          <div className="mt-6 space-y-3">
            <button type="button" onClick={addToCart} className={cn(BUTTON, 'border border-[#121212] hover:bg-[#f5f5f5]')}>Add to cart</button>
            <button type="button" onClick={() => { cart.add(product.handle, variant.id, quantity); navigate(path('checkout')); }} className={cn(BUTTON, 'bg-[#121212] text-white hover:bg-[#121212]/85')}>Buy it now</button>
          </div>
          {added && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-[#f5f5f5] px-3 py-2.5 text-sm" role="status">
              <Check className="h-4 w-4" aria-hidden="true" /> Added to your cart.
              <Link to={path('cart')} className="ml-auto font-semibold underline underline-offset-4">View cart ({cart.count})</Link>
            </p>
          )}

          {settings.buttonProduct && (
            <PostToPay key={`${product.handle}-${variant.id}`} placement="product" priceCents={product.priceCents} item={{ handle: product.handle, variantId: variant.id }} />
          )}

          <p className="mt-6 text-sm leading-6 text-[#121212]/75">{product.description}</p>
          <ul className="mt-4 space-y-1.5 text-sm text-[#121212]/75">
            {product.details.map((detail) => <li key={detail} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{detail}</li>)}
          </ul>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">You may also like</h2>
        <ProductGrid products={PRODUCTS.filter((item) => item.handle !== product.handle).slice(0, 4)} />
      </section>
    </main>
  );
}

export function CartPage() {
  const cart = useCart();
  const [settings] = useVouchSettings();
  const path = useStorePath();
  const navigate = useNavigate();
  const lines = cart.items.flatMap(({ product, line }) => Array.from({ length: line.quantity }, () => ({ label: product.title, cents: product.priceCents })));

  if (cart.items.length === 0) {
    return (
      <main className={cn(PAGE, 'py-16 text-center')}>
        <ShoppingBag className="mx-auto h-8 w-8 text-[#121212]/40" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Your cart is empty</h1>
        <Link to={path('shop')} className="mt-6 inline-flex h-12 items-center rounded-md bg-[#121212] px-6 text-base font-semibold text-white">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main className={cn(PAGE, 'py-6 md:py-10')}>
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your cart</h1>
        <Link to={path('shop')} className="text-sm underline underline-offset-4">Continue shopping</Link>
      </div>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_380px] md:gap-12">
        <ul className="divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]">
          {cart.items.map(({ product, variant, line, totalCents }) => (
            <li key={`${line.handle}-${line.variantId}`} className="flex gap-4 py-5">
              <Link to={path(`products/${product.handle}`)} className="w-24 shrink-0"><ProductArt product={product} variant={variant} className="rounded-md" /></Link>
              <div className="flex flex-1 flex-col gap-1">
                <Link to={path(`products/${product.handle}`)} className="font-semibold hover:underline">{product.title}</Link>
                <p className="text-sm text-[#121212]/60">{money(product.priceCents)}{product.variants.length > 1 && ` · ${variant.name}`}</p>
                <div className="mt-1 flex items-center gap-4">
                  <Quantity small value={line.quantity} onChange={(quantity) => cart.setQuantity(line.handle, line.variantId, quantity)} min={0} />
                  <button type="button" onClick={() => cart.setQuantity(line.handle, line.variantId, 0)} className="text-sm text-[#121212]/60 underline underline-offset-4 hover:text-[#121212]">Remove</button>
                </div>
              </div>
              <p className="font-medium">{money(totalCents)}</p>
            </li>
          ))}
        </ul>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-base">Estimated total</span>
            <span className="text-lg font-semibold">{money(cart.subtotalCents)} USD</span>
          </div>
          <p className="mt-1 text-xs text-[#121212]/60">Taxes, discounts and shipping calculated at checkout.</p>
          {settings.cartTotalLine && <VouchLine priceCents={cart.subtotalCents} scope="order" />}
          <button type="button" onClick={() => navigate(path('checkout'))} className={cn(BUTTON, 'mt-5 bg-[#121212] text-white hover:bg-[#121212]/85')}>Check out</button>
          {settings.buttonCart && <PostToPay key={cart.subtotalCents} placement="cart" priceCents={cart.subtotalCents} lines={lines} />}
        </div>
      </div>
    </main>
  );
}

// Shopify-style checkout: express options (with Post to Pay as one of them), then the card form.
// Only Post to Pay works; the card fields are disabled so nobody types real card details into the demo.
const SAMPLE_TAX_RATE = 0.08;

export function CheckoutPage() {
  const cart = useCart();
  const [settings] = useVouchSettings();
  const path = useStorePath();
  const tax = Math.round(cart.subtotalCents * SAMPLE_TAX_RATE);
  const free = cart.subtotalCents >= demoStore.freeShippingOverCents;
  const shipping = free ? 0 : 600;

  return (
    <div className="min-h-full bg-white font-sans text-[#121212]">
      <header className="border-b border-[#e8e8e8]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center px-4 md:px-8">
          <Link to={path()} className="text-lg font-semibold tracking-tight">{demoStore.name}</Link>
          <Link to={path('cart')} aria-label="Back to cart" className="ml-auto"><ShoppingBag className="h-5 w-5 text-[#121212]/70" aria-hidden="true" /></Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1120px] md:grid-cols-[1fr_400px]">
        <aside className="order-first border-b border-[#e8e8e8] bg-[#f5f5f5] px-4 py-6 md:order-last md:border-b-0 md:border-l md:px-8 md:py-10">
          {cart.items.length === 0 ? (
            <p className="text-sm text-[#121212]/60">Your cart is empty. <Link to={path('shop')} className="underline">Continue shopping</Link></p>
          ) : (
            <ul className="space-y-4">
              {cart.items.map(({ product, variant, line, totalCents }) => (
                <li key={`${line.handle}-${line.variantId}`} className="flex items-center gap-4">
                  <span className="relative w-16 shrink-0">
                    <ProductArt product={product} variant={variant} className="rounded-md ring-1 ring-black/10" />
                    <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#121212]/70 text-xs text-white">{line.quantity}</span>
                  </span>
                  <span className="flex-1 text-sm"><span className="block font-semibold">{product.title}</span>{product.variants.length > 1 && <span className="text-[#121212]/60">{variant.name}</span>}</span>
                  <span className="text-sm">{money(totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(cart.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{free ? 'Free' : money(shipping)}</dd></div>
            <div className="flex justify-between"><dt>Estimated taxes</dt><dd>{money(tax)}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd><span className="mr-1 text-xs font-normal text-[#121212]/60">USD</span>{money(cart.subtotalCents + tax + shipping)}</dd></div>
          </dl>
        </aside>

        <main className="px-4 py-6 md:px-8 md:py-10">
          <p className="text-center text-sm text-[#121212]/60">Express checkout</p>
          {/* Post to Pay is one of the express tiles, the same size as the others; its tagline and panel span the row. */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={cn(BUTTON, 'bg-[#5a31f4] text-white')}>Shop Pay</button>
            <button type="button" className={cn(BUTTON, 'bg-[#ffc439] text-[#003087]')}>PayPal</button>
            <button type="button" className={cn(BUTTON, 'bg-black text-white', !settings.buttonCheckout && 'col-span-2')}>G Pay</button>
            {settings.buttonCheckout && cart.items.length > 0 && <PostToPay key={cart.subtotalCents} placement="checkout" priceCents={cart.subtotalCents} />}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase text-[#121212]/50" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e8e8e8]" />or<span className="h-px flex-1 bg-[#e8e8e8]" />
          </div>

          <h2 className="text-xl font-semibold">Contact</h2>
          <MockField label="Email" className="mt-3" />
          <h2 className="mt-8 text-xl font-semibold">Delivery</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MockField label="First name" />
            <MockField label="Last name" />
            <MockField label="Address" className="col-span-2" />
            <MockField label="City" />
            <MockField label="ZIP code" />
          </div>
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
          <button type="button" disabled className={cn(BUTTON, 'mt-6 bg-[#121212] text-white disabled:opacity-90')}>Pay now</button>
          <p className="mt-2 text-center text-xs text-[#121212]/50">Demo store: payment is turned off.</p>
        </main>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <main className={cn(PAGE, 'max-w-[760px] py-10 md:py-16')}>
      <p className="text-xs uppercase tracking-[0.15em] text-[#121212]/60">Our story</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Made for the long way round.</h1>
      <img src={bottleSlate} alt="" className="mt-8 aspect-[16/9] w-full rounded-md object-cover" />
      <div className="mt-8 space-y-4 text-[#121212]/80">
        <p>Harbor &amp; Pine started in 2019 on the Casco Bay ferry, with a dented, sweating bottle and a conversation about why gear this simple was so hard to get right.</p>
        <p>We make a small range on purpose: a bottle, a tumbler, and the pieces that keep them going. Every design is tested on the water and on the trail for a full season before it ships, and every bottle carries a lifetime warranty on its insulation.</p>
        <p>We’re a team of nine in Portland, Maine. Most of us still take the ferry.</p>
      </div>
    </main>
  );
}

export function FaqPage() {
  const { hash } = useLocation();
  const items: [string, string, string?][] = [
    ['How long does shipping take?', 'Orders ship within one business day. Standard shipping takes 3–5 business days in the US, and it’s free on orders over $50.'],
    ['What is your return policy?', 'Return anything unused within 30 days for a full refund. Start a return from your order confirmation email.'],
    ['How do I clean my bottle?', 'Hand wash the bottle with warm, soapy water and the Bottle Brush Kit. Lids and straw caps are dishwasher safe.'],
    ['What is Post to Pay?', 'Post to Pay, by Vouch, lets you pay less by posting about what you buy. Pick where you’ll post, see your discount, then post within the window after delivery to keep it.', 'post-to-pay'],
  ];
  return (
    <main className={cn(PAGE, 'max-w-[760px] py-10 md:py-16')}>
      <h1 className="text-4xl font-semibold tracking-tight">Shipping, returns &amp; FAQ</h1>
      <div className="mt-8 divide-y divide-[#e8e8e8] border-y border-[#e8e8e8]">
        {items.map(([question, answer, id]) => (
          <details key={question} id={id} open={hash === `#${id}` || undefined} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              {question}<Plus className="h-4 w-4 transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="mt-3 text-[#121212]/75">{answer}</p>
          </details>
        ))}
      </div>
    </main>
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

function Quantity({ value, onChange, small = false, min = 1 }: { value: number; onChange: (value: number) => void; small?: boolean; min?: number }) {
  return (
    <div className={cn('inline-flex items-center rounded-md border border-[#121212]/30', small ? 'h-9' : 'mt-2 h-11')} role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-full w-10 place-items-center disabled:text-[#121212]/30">
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)} className="grid h-full w-10 place-items-center">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
