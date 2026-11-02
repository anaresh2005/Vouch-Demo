# Vouch — Investor Demo

The standalone investor demo for Vouch, deployed at **demo.vouch.so**.

It shows the shopper's Post to Pay flow as we expect it to look by the end of 2026, on a
fictional merchant's product page (Harbor & Pine). The Post to Pay panel is a React port of the
live storefront block in Vouch-MVP-Production (`extensions/vouch-post-to-pay`); its stylesheet,
`src/components/storefront/post-to-pay.css`, is copied verbatim, and demo-only additions live in
`post-to-pay-demo.css`. The merchant dashboard is not part of the demo; the "Not in this demo"
menu describes it and lists roadmap features that aren't mocked.

The only live call is the Instagram/TikTok account scan (Modash), made through a Supabase edge
function (`modash-checkout-lookup`). Everything else, including checkout, is simulated.

> This is the demo site only. The production app lives in a separate repository.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase edge functions (Modash proxy) — project `jscargzwjnoohsxvkmsx`

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
VITE_SUPABASE_URL=https://jscargzwjnoohsxvkmsx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=jscargzwjnoohsxvkmsx
```

## Deployment

Pushing to `main` triggers an automatic deploy on Vercel (demo.vouch.so).
Build command: `npm run build` · Output: `dist/`.

## Demo access

`/` is a password gate (stored in `sessionStorage`) that leads to the demo at `/checkout`.
`/checkout` has a Desktop/Mobile switch; Mobile frames `/checkout/store` at a 375px width.
Old `/dashboard` links redirect to `/checkout`.

## Post to Pay discounts

The demo is deliberately generous: every account gets at least 25% off. From 1,000 followers the
discount rises linearly to 100% off at 2,500 followers, rounded to the nearest 5%
(`src/lib/postToPayDiscount.ts`). The discount applies to the product price; tax isn't charged
today, and missing the posting window would charge the discount plus tax.
