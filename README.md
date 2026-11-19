# Vouch — Post to Pay Demo

The standalone investor demo for Vouch, deployed at **demo.vouch.so**.

It has two views, switched in the header:

- **Store**: Harbor & Pine, a fictional store (home, collections, six product pages, a working cart
  and checkout) where shoppers meet Post to Pay. The Post to Pay panel started as a React port of the
  live storefront block in Vouch-MVP-Production (`extensions/vouch-post-to-pay`) and now follows the
  November 2026 redesign in Figma, which the live block doesn't have yet (see "Revamped design" below).
- **Merchant dashboard**: the product's dashboard, copied into `src/dashboard` and restyled to the App
  UI Guidelines (see "Merchant dashboard" below).

The settings gear (store view) switches each place Post to Pay appears on or off; Reset there
clears the cart, the settings and the shopper's Post to Pay result. The Roadmap button opens
`/roadmap`, a development timeline (live today, by the end of 2026, next) that marks what the demo
shows; its content is in `src/lib/roadmap.ts`.

The only live call is the Instagram/TikTok account scan (Modash), made through the product's
`modash-checkout-lookup` edge function (in Vouch-MVP-Production; the demo's own Supabase project was
retired in November 2026). That endpoint allows 25 scans a day in total; after that the panel says
the day's scans are used up. Everything else, including checkout, is simulated.

Roadmap features mocked in the demo:
- **More platforms.** Snapchat, YouTube, X, Facebook, Pinterest, LinkedIn and Substack sit alongside
  Instagram and TikTok. They aren't scanned: the panel says so, accepts any username and gives 100% off.
- **Cart and checkout placements.** On the cart and checkout pages the offer covers the whole order
  (one row per cart item on "You're in"). At checkout, Post to Pay is one of the express tiles (with
  mock Shop Pay, PayPal and G Pay), above a disabled card form.
- **Secondary callouts.** From Figma's Post to Pay page ("Secondary callouts"): the line under the price,
  the line under the cart total, the footer badge, the top-strip slide, the unlocked pill and the popup
  (for visitors from a social app; "Show the popup now" in the settings opens it). The thank-you page
  block is left out for now. Defaults: everything on except the popup
  (`src/lib/demoSettings.ts`). The line under the price, the top strip and the button's icon change
  platform together, on one clock. The footer shows the standard Shopify payment icons beside the badge.
- **Checkout hand-off.** Where the live product sends the shopper to Shopify checkout to enter their card
  (Check out, or Continue to payment at checkout, inside the panel), the demo ends: the button is shown but
  disabled, and a "Demo only" note explains the hand-off. The store's own checkout page has its card
  form and Pay now turned off.
- **Ambassador codes.** Shoppers get a personal code (anyone who uses it gets 10% off; they earn 10%
  of those sales). One compact, optional line ("Friends get 10% off, you earn 10%", with an info tip)
  appears on "You're in". Reveal code says the code arrives by email after checkout; it isn't shown
  before the order, because Vouch has no email address until checkout.
- **Revamped design.** The button and panel follow the November 2026 redesign in Figma ("Vouch
  Branding (Revamped)", Post to Pay page), ahead of the live product: gradient button with the
  platform icons cycling, gradient logo header, a 3-by-3 platform picker, the "You're in" price box,
  the shorter How it works, and "Claimed". Its stylesheet (`src/components/storefront/post-to-pay.css`)
  is no longer a copy of the live block's.

The store's theme follows Post to Pay's default look: 6px corners and 16px semibold Inter on buttons.
The shopper's Post to Pay result is shared across the store (`src/lib/storeState.ts`): once they qualify,
every button, line and the pill show their discount. The cart, settings and result live in
sessionStorage (`src/lib/demoState.ts`), so the Mobile preview shows the same cart as Desktop.
Every product image is an AI-generated studio photo in the same setup, so the catalog matches; they
are in `src/assets/products`, and `scripts/product-photos` has the prompts to make more.

## Merchant dashboard

`/dashboard` is the product's merchant dashboard, copied from Vouch-MVP-Production's
`henry/creator-profile-cache` branch (the newest dashboard work, November 2026) into `src/dashboard`,
with its `@/` imports rewritten to `@dashboard/`. It runs on the product's design-preview sample data
(`src/dashboard/preview`), re-pointed at Harbor & Pine; `integrations/supabase/client.ts` re-exports the
in-browser stand-in, so it never reaches a database. It's read-only: any save shows "This is a demo,
so changes aren't saved."

The demo applies the App UI Guidelines' cleanup list (Figma, "App UI Guidelines" page, appendix)
ahead of the product: ink and palette neutrals for text, dividers and surfaces (`src/index.css`, which
the whole demo shares); brand/700 #2330D4 for primary hover and brand/200 for disabled; Semi Bold only
for page titles and card and section headings, Medium elsewhere, never Bold; palette status badges
(dot, ink text, light tint; charge pending gray); and the new periwinkle logo and icon. To refresh it
from the product, copy the files again and reapply these changes.

> This is the demo site only. The production app lives in a separate repository.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Account scans call the product's Supabase project (`zyvdwncrpjeltyfwnweh`)

## Local development

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:8080`.

## Environment variables

Create a `.env` (or set these in your host's dashboard). Only the `VITE_`-prefixed
values are read by the app at build time:

```
VITE_SUPABASE_URL=https://zyvdwncrpjeltyfwnweh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<the product's publishable key>
VITE_SUPABASE_PROJECT_ID=zyvdwncrpjeltyfwnweh
```

## Deployment

Pushing to `main` triggers an automatic deploy on Vercel (demo.vouch.so).
Build command: `npm run build` · Output: `dist/`.

## Demo access

`/` is a password gate (stored in `sessionStorage`) that leads to the store at `/store`. Store pages live
under `/store` (`/store/products/everyday-bottle`, `/store/cart`, `/store/checkout`, …); Mobile frames the
same page at `/frame/store/…` in a 375 × 812 phone drawn in CSS. The dashboard is at `/dashboard`.
Old `/checkout` links redirect to `/store`.

## Post to Pay discounts

The demo is deliberately generous: every scanned account gets at least 25% off. From 1,000 followers the
discount rises linearly to 100% off at 2,500 followers, rounded to the nearest 5%
(`src/lib/postToPayDiscount.ts`). The discount applies to the product price; tax isn't charged
today, and missing the posting window would charge the discount plus tax.
