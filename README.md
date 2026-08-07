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

## Account, billing & login

PilotResto sells a single plan — **PilotResto Pro, 29 €/mois, sans
engagement, sans essai gratuit** — directly from this site. The flow is
signup-first: create an account (`/inscription`), subscribe via Stripe
Checkout, land in `/dashboard`. Anyone logged in without an active
subscription is redirected to `/subscribe`. Billing (payment method,
invoices, cancellation) is handled entirely by the **Stripe Customer
Portal** — the site never reimplements that UI. The real application (at
`https://app.pilotresto.pro`) is opened from the dashboard once a customer
is subscribed.

This site shares its Stripe account and Supabase project with the existing
PilotResto application ("V3") — see the operational notes below before
deploying.

### Required environment variables (`.env.local`, already set on Vercel)

| Variable | Used by | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | pricing, checkout, portal, webhook, dashboard | Without it, pricing/checkout gracefully show a "configuration requise" state instead of crashing the build. |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` | Signing secret for the webhook (see below). |
| `NEXT_PUBLIC_SUPABASE_URL` | auth, dashboard, webhook | The Supabase project's URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser/server auth | Public anon key — safe to expose client-side. |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/stripe/webhook` only | Secret. Bypasses RLS to create accounts and sync subscription status. Never expose client-side. |

`STRIPE_TRIAL_DAYS` is no longer read anywhere — there is no free trial.

### Stripe setup

`npm run setup:stripe` (see `scripts/setup-stripe.mjs`) creates a Product +
monthly Price + `/api/stripe/webhook` endpoint, and is idempotent — but if
the Stripe account **already sells this plan under a different Product**,
don't run it; point `getPrimaryPlan()`'s expectations (one active Product,
one active monthly Price) at the existing one instead, and make sure only
one qualifying Product stays active. `src/lib/stripe/pricing-service.ts`
otherwise just picks whichever active Product it finds first, which is
ambiguous — and was, once, wrong — the moment more than one exists.

The webhook must be subscribed to: `checkout.session.completed`,
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

### Supabase: the real schema (confirmed live, not a proposal)

This site reads and writes the same, pre-existing tables the real
application ("V3") uses. **There is no dedicated table for this
integration** — an earlier version of this doc proposed creating
`profiles` and then `subscriptions`; both turned out to already exist with
a different, restaurant-centric shape. Verified live, with real rows:

- **`profiles`** — maps a Supabase auth user to their restaurant. Columns
  used here: `id` (= `auth.users.id`), `restaurant_id`, `role`,
  `first_name`, `last_name`, `created_at`.
- **`restaurants`** — the confirmed access gate. Columns used here: `id`,
  `name`, `plan_id`, `stripe_customer_id`, `stripe_subscription_id`,
  `subscription_status` (raw Stripe status string), `access_status`
  (normalized gate: `trial` | `active` | `past_due` | `canceled` |
  `incomplete` — **this is what `src/proxy.ts` checks**), `trial_ends_at`,
  `past_due_since`.
- **`subscriptions`** — a fuller, newer table, one row per restaurant
  (`restaurant_id`, not a user id). Columns used here: `status`, `plan`,
  `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`,
  `has_payment_method`.

A Postgres trigger already provisions `profiles` + `restaurants` +
`subscriptions` rows when a new `auth.users` row is created (confirmed —
this site's `/inscription` doesn't need to create anything itself). New
signups land with `restaurants.access_status = 'trial'`, `plan_id =
'starter'` by default; this site's own checkout flow overwrites that with
real Stripe data once someone pays.

**Both `restaurants` and `subscriptions` are kept in sync on every Stripe
webhook event**, per explicit confirmation that the real app may still
read either. `src/app/api/stripe/webhook/route.ts`'s `syncBillingToRestaurant`
is the single place that writes both.

`subscriptions.plan` / `restaurants.plan_id` store lowercase slugs
(existing rows use `"starter"`), matching the convention V3 already uses
via its own `getPlanByPriceId()`. This site's Price → slug mapping is
fixed, not derived — `PLAN_BY_PRICE_ID` in
`src/app/api/stripe/webhook/route.ts` — one entry, since only one plan is
active (`price_1TybXBEw9od5qGxlKJ836Msf` → `"pro"`). Add a new entry there
if a second plan is ever sold.

Enable the Google and Apple providers in **Authentication → Providers** if
you want those buttons on `/connexion` and `/inscription` to work (the
client-side call is already wired).

### How it fits together

- `/inscription` — Supabase signup (email/password or Google/Apple); the
  restaurant/profile/subscription rows are provisioned automatically by an
  existing DB trigger, nothing to do here.
- `/subscribe` — shown to logged-in users without an active subscription;
  same pricing card as `/tarifs`.
- `/api/stripe/create-checkout-session` — **requires an authenticated
  session** (checked server-side, never trusts the frontend); sets
  `client_reference_id` to the Supabase user id so the webhook can resolve
  their `restaurant_id` (via `profiles`) and update it directly.
- `/api/stripe/customer-portal` — creates a Billing Portal session for the
  logged-in user's restaurant's Stripe customer; all three dashboard
  billing buttons use it.
- `/api/stripe/webhook` — resolves the restaurant (via `client_reference_id`
  → `profiles`, or via `stripe_customer_id` for later events) and syncs
  `restaurants` + `subscriptions` together; falls back to
  find-or-create-by-email only when a checkout session has no
  `client_reference_id` (e.g. a manual test from the Stripe Dashboard).
- `src/proxy.ts` — protects `/dashboard/*`, `/account/*`, `/settings/*`
  (add new private prefixes to the matcher as they're built): redirects to
  `/connexion` if unauthenticated, to `/subscribe` if authenticated but
  their restaurant's `access_status` isn't `active`/`past_due`.
- `/dashboard` — espace client: live subscription status (reads Stripe
  directly, not just the cached DB copy), invoice history, reactivation
  alert for canceled/past_due/incomplete accounts, and a link to open the
  real app.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
