/**
 * src/lib/stripe/index.ts
 * Client Stripe + fonctions utilitaires côté serveur.
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY               — Clé secrète Stripe (sk_live_… ou sk_test_…)
 *   STRIPE_WEBHOOK_SECRET           — Signing secret du webhook (whsec_…)
 *   STRIPE_PRICE_STARTER_MONTHLY    — ID du prix mensuel Starter
 *   STRIPE_PRICE_STARTER_ANNUAL     — ID du prix annuel Starter
 *   STRIPE_PRICE_PRO_MONTHLY        — ID du prix mensuel Pro
 *   STRIPE_PRICE_PRO_ANNUAL         — ID du prix annuel Pro
 *   STRIPE_PRICE_MULTI_MONTHLY      — ID du prix mensuel Multi
 *   STRIPE_PRICE_MULTI_ANNUAL       — ID du prix annuel Multi
 *   NEXT_PUBLIC_APP_URL             — URL de base (https://app.restopilot.fr)
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types'

// ── Client Stripe (singleton) ─────────────────────────────────

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
    })
  }
  return _stripe
}

// ── Table de correspondance plan ↔ prix Stripe ────────────────

export type BillingInterval = 'monthly' | 'annual'

export const STRIPE_PRICES: Record<SubscriptionPlan, Record<BillingInterval, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    annual:  process.env.STRIPE_PRICE_PRO_ANNUAL  ?? '',
  },
  multi: {
    monthly: process.env.STRIPE_PRICE_MULTI_MONTHLY ?? '',
    annual:  process.env.STRIPE_PRICE_MULTI_ANNUAL  ?? '',
  },
}

/** Retourne le plan RestoPilot correspondant à un price_id Stripe. */
export function planFromPriceId(priceId: string): SubscriptionPlan {
  for (const [plan, intervals] of Object.entries(STRIPE_PRICES)) {
    if (Object.values(intervals).includes(priceId)) {
      return plan as SubscriptionPlan
    }
  }
  return 'starter'
}

// ── Types ─────────────────────────────────────────────────────

export type SubscriptionInfo = {
  plan:               SubscriptionPlan
  status:             SubscriptionStatus
  current_period_end: string | null
  stripe_customer_id: string | null
  cancel_at_period_end: boolean
  created_at:         string | null
}

// ── Checkout Session ──────────────────────────────────────────

/**
 * Crée une Stripe Checkout Session pour un nouveau ou un upgrade d'abonnement.
 */
export async function createCheckoutSession(params: {
  priceId:      string
  restaurantId: string
  customerEmail: string
  /** Si le restaurant a déjà un customer_id Stripe, on le réutilise */
  stripeCustomerId?: string | null
}): Promise<string> {
  const stripe  = getStripe()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode:    'subscription',
    payment_method_types:       ['card'],
    payment_method_collection:  'always',
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { restaurant_id: params.restaurantId },
    },
    success_url: `${appUrl}/dashboard/upgrade?payment=success`,
    cancel_url:  `${appUrl}/pricing`,
    metadata: { restaurant_id: params.restaurantId },
    allow_promotion_codes: true,
  }

  // Rattacher à un client existant ou créer via email
  if (params.stripeCustomerId) {
    sessionParams.customer = params.stripeCustomerId
  } else {
    sessionParams.customer_email = params.customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) throw new Error('Stripe n\'a pas retourné d\'URL de checkout')
  return session.url
}

// ── Billing Portal ────────────────────────────────────────────

/**
 * Crée une session Stripe Billing Portal pour gérer l'abonnement.
 */
export async function createBillingPortalSession(params: {
  stripeCustomerId: string
  returnPath?: string
}): Promise<string> {
  const stripe  = getStripe()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer:   params.stripeCustomerId,
    return_url: `${appUrl}${params.returnPath ?? '/parametres/abonnement'}`,
  })

  return session.url
}

// ── Statut d'abonnement ───────────────────────────────────────

/**
 * Récupère le statut d'abonnement d'un restaurant depuis Supabase.
 */
export async function getSubscriptionStatus(
  restaurantId: string
): Promise<SubscriptionInfo | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('restaurant_id', restaurantId)
    .single()

  if (!data) return null

  // Vérifier si l'annulation en fin de période est active via Stripe
  let cancelAtPeriodEnd = false
  if (data.stripe_subscription_id && data.status === 'active') {
    try {
      const sub = await getStripe().subscriptions.retrieve(data.stripe_subscription_id)
      cancelAtPeriodEnd = sub.cancel_at_period_end
    } catch { /* ignorer si offline */ }
  }

  return {
    plan:               data.plan as SubscriptionPlan,
    status:             data.status as SubscriptionStatus,
    current_period_end: data.current_period_end,
    stripe_customer_id: data.stripe_customer_id,
    cancel_at_period_end: cancelAtPeriodEnd,
    created_at:         data.created_at ?? null,
  }
}

// ── Liste des factures Stripe ─────────────────────────────────

export type StripeInvoice = {
  id:          string
  number:      string | null
  date:        number   // unix timestamp
  amount:      number   // en euros
  status:      string | null
  pdf_url:     string | null
  hosted_url:  string | null
}

export async function getCustomerInvoices(
  stripeCustomerId: string
): Promise<StripeInvoice[]> {
  const stripe = getStripe()

  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit:    24,
    status:   'paid',
  })

  return invoices.data.map(inv => ({
    id:         inv.id,
    number:     inv.number ?? null,
    date:       inv.created,
    amount:     (inv.amount_paid ?? 0) / 100,
    status:     inv.status ?? null,
    pdf_url:    inv.invoice_pdf    ?? null,
    hosted_url: inv.hosted_invoice_url ?? null,
  }))
}

// ── Annulation d'abonnement ───────────────────────────────────

/**
 * Annule l'abonnement à la fin de la période en cours (pas immédiatement).
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<void> {
  await getStripe().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Réactive un abonnement annulé (si toujours dans la période en cours).
 */
export async function reactivateSubscription(
  stripeSubscriptionId: string
): Promise<void> {
  await getStripe().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  })
}
