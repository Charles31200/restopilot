This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Stripe pricing integration

The `/tarifs` page and the homepage "Tarifs" section read pricing live from
Stripe — no plan name, price, or feature list is hardcoded in this repo
(`src/lib/stripe/pricing-service.ts`). To make it render real plans:

1. Add `STRIPE_SECRET_KEY` (and optionally `STRIPE_TRIAL_DAYS`, default `30`)
   to `.env.local`. Without it, the pricing sections fall back to a "tarifs
   en cours de configuration" message instead of crashing the build.
2. In the Stripe Dashboard, for each plan create one active Product with:
   - **Marketing features** (`product.marketing_features`): the bullet list
     shown on the pricing card.
   - **Metadata**:
     - `order`: `"1"` | `"2"` | `"3"` — left-to-right sort order.
     - `badge` (optional): `"populaire"` or `"complet"`.
     - `comparison`: a JSON string mapping the row keys from
       `COMPARISON_ROWS` in `src/lib/stripe/pricing-service.ts` (e.g.
       `stock`, `ia_missions`, `api`, …) to `"yes"`, `"no"`, or `"premium"`,
       e.g. `{"stock":"yes","api":"no","ia_missions":"premium"}`.
   - Exactly one active recurring **monthly** Price and one active recurring
     **annual** Price.
3. The free trial is enforced by the Checkout route
   (`src/app/api/stripe/checkout/route.ts`) via `subscription_data.trial_period_days`,
   so it applies even if the Prices themselves have no trial configured.

New customers subscribe directly from the site via Stripe Checkout. Existing
customers manage or change their subscription from inside the real
application (reached through "Connexion" → `https://app.pilotresto.pro`) —
the marketing site has no session/auth of its own, by design.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
