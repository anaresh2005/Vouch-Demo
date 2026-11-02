# Vouch — Investor Demo

The standalone investor demo for Vouch, deployed at **demo.vouch.so**.

It shows the shopper's Post to Pay flow as we expect it to look by the end of 2026, on a
fictional merchant's product page (Harbor & Pine). The Post to Pay panel is a React port of the
live storefront block in Vouch-MVP-Production (`extensions/vouch-post-to-pay`); its stylesheet,
`src/components/storefront/post-to-pay.css`, is copied verbatim, and demo-only additions live in
`post-to-pay-demo.css`. The merchant dashboard is not part of the demo. The Roadmap button opens
`/roadmap`, a development timeline (live today, by the end of 2026, next) that marks what the demo
shows; its content is in `src/lib/roadmap.ts`.

The only live call is the Instagram/TikTok account scan (Modash), made through the product's
`modash-checkout-lookup` edge function (in Vouch-MVP-Production; the demo's own Supabase project was
retired in November 2026). That endpoint allows 25 scans a day in total; after that the panel says
the day's scans are used up. Everything else, including checkout, is simulated.

Roadmap features mocked in the demo:
- **More platforms.** Snapchat, Substack, X and LinkedIn sit alongside Instagram and TikTok. They
  aren't scanned: the panel says so, accepts any username and gives 100% off.
- **Cart and checkout placements.** The demo switches between the product, cart and checkout pages.
  On the cart and checkout pages the offer covers the whole order. At checkout, Post to Pay is one of
  the express tiles (with mock Shop Pay, PayPal and G Pay), above a disabled card form.
- **Ambassador codes.** Shoppers get a personal code (their followers get 10% off; they earn 10% of
  each order), and it's emailed to them. One compact, optional line ("Earn 10% commission", with an
  info tip) appears identically on the "You qualify!" step and the order confirmation.

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
