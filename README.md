# Vouch — Investor Demo

The standalone investor demo for Vouch, deployed at **demo.vouch.so**.

It presents a password-gated walkthrough of the Vouch dashboard and "Pay with a Post"
checkout, running on mock data so it can be explored without a real account. The only
live backend dependency is influencer lookup (Modash), proxied through a dedicated
Supabase project's edge functions.

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

The landing page is a single password gate. The demo password unlocks the dashboard
for the session (stored in `sessionStorage`).

## Post to Pay discounts

Qualifying accounts receive 10% off at 2,500 followers, increasing linearly to
100% off at 10,000 followers (capped at 100%). The formula is
`10 + 90 * clamp((followers - 2500) / 7500, 0, 1)` percent.
Accounts below 2,500 followers do not qualify. Eligibility depends only on follower
count; engagement rate and sponsored-post count are not requirements.
The demo applies the discount to the displayed order total including mock tax.

The remaining balance is shown as payable today. Posting within 72 hours of
delivery retains the discount; missing the deadline would charge the saved amount.
All payments and orders in this flow remain simulated.
