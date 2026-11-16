# Vouch — Investor Demo

The standalone investor demo for Vouch, deployed at **demo.vouch.so**.

It shows the shopper's Post to Pay flow as we expect it to look by the end of 2026, on a
fictional merchant's product page (Harbor & Pine). The Post to Pay panel started as a React port of
the live storefront block in Vouch-MVP-Production (`extensions/vouch-post-to-pay`) and now follows
the November 2026 redesign in Figma, which the live block doesn't have yet (see "Revamped design"
below). The merchant dashboard is not part of the demo. The Roadmap button opens
`/roadmap`, a development timeline (live today, by the end of 2026, next) that marks what the demo
shows; its content is in `src/lib/roadmap.ts`.

The only live call is the Instagram/TikTok account scan (Modash), made through the product's
`modash-checkout-lookup` edge function (in Vouch-MVP-Production; the demo's own Supabase project was
retired in November 2026). That endpoint allows 25 scans a day in total; after that the panel says
the day's scans are used up. Everything else, including checkout, is simulated.

Roadmap features mocked in the demo:
- **More platforms.** Snapchat, YouTube, X, Facebook, Pinterest, LinkedIn and Substack sit alongside
  Instagram and TikTok. They aren't scanned: the panel says so, accepts any username and gives 100% off.
- **Cart and checkout placements.** The demo switches between the product, cart and checkout pages.
  On the cart and checkout pages the offer covers the whole order. At checkout, Post to Pay is one of
  the express tiles (with mock Shop Pay, PayPal and G Pay), above a disabled card form.
- **Checkout hand-off.** Where the live product sends the shopper to Shopify checkout to enter their card
  (Check out, or Continue to payment at checkout), the demo ends: the button is shown but disabled, and
  a "Demo only" note explains the hand-off.
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

`/` is a password gate (stored in `sessionStorage`) that leads to the demo at `/checkout`.
`/checkout` switches between the product, cart and checkout pages and between Desktop and Mobile; Mobile
frames `/checkout/store?page=…` in a 375 × 812 phone drawn in CSS.
Old `/dashboard` links redirect to `/checkout`.

## Post to Pay discounts

The demo is deliberately generous: every scanned account gets at least 25% off. From 1,000 followers the
discount rises linearly to 100% off at 2,500 followers, rounded to the nearest 5%
(`src/lib/postToPayDiscount.ts`). The discount applies to the product price; tax isn't charged
today, and missing the posting window would charge the discount plus tax.
