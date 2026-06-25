/**
 * POST /api/webhooks/stripe
 * Webhook Stripe — reçoit et traite les événements d'abonnement.
 *
 * CRITIQUE : Ce handler doit lire le corps brut (raw body) pour
 * vérifier la signature Stripe. Ne pas utiliser NextResponse.json()
 * avant d'appeler stripe.webhooks.constructEvent().
 *
 * Événements traités :
 *  - checkout.session.completed        → active l'abonnement
 *  - customer.subscription.updated     → met à jour plan + statut
 *  - customer.subscription.deleted     → marque 'canceled'
 *  - invoice.payment_failed            → marque 'past_due' + email alerte
 *  - invoice.payment_succeeded         → restaure 'active' si 'past_due'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { getStripe, planFromPriceId } from '@/lib/stripe'
import type { Database } from '@/types'
import type Stripe from 'stripe'

// ── Client admin (bypasse RLS — pas de session utilisateur ici) ──

function getAdmin() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Envoi d'email d'alerte paiement ──────────────────────────

async function sendPaymentFailedAlert(email: string, restaurantName: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || !email) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.restopilot.fr'

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'PilotResto <facturation@restopilot.fr>',
      to:      [email],
      subject: `⚠️ Échec du paiement — ${restaurantName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#EF4444;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:20px;">⚠️ Problème de paiement</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:0 0 8px 8px;">
            <p>Le renouvellement de votre abonnement <strong>${restaurantName}</strong> a échoué.</p>
            <p>Votre accès sera maintenu pendant <strong>7 jours</strong>. Au-delà, votre compte sera suspendu.</p>
            <a href="${appUrl}/parametres/abonnement"
               style="display:inline-block;background:#2563EB;color:#fff;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
              Mettre à jour mon moyen de paiement
            </a>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="font-size:11px;color:#9CA3AF;">PilotResto — gestion automatisée de restaurant</p>
          </div>
        </div>
      `,
    }),
  }).catch(() => { /* silencieux si Resend indisponible */ })
}

// ── Handlers par événement ────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin        = getAdmin()
  const restaurantId = session.metadata?.restaurant_id
  if (!restaurantId) return

  const subscriptionId = session.subscription as string | null
  const customerId     = session.customer     as string | null

  if (!subscriptionId) return

  // Récupérer les détails de l'abonnement Stripe
  const stripeSub  = await getStripe().subscriptions.retrieve(subscriptionId)
  const priceId    = stripeSub.items.data[0]?.price.id ?? ''
  const plan       = planFromPriceId(priceId)
  const statusVal: import('@/types').SubscriptionStatus =
    stripeSub.status === 'trialing' ? 'trialing' : 'active'
  // current_period_end is a unix timestamp on the Stripe object
  const periodEnd  = new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()

  await admin
    .from('subscriptions')
    .upsert({
      restaurant_id:           restaurantId,
      stripe_subscription_id:  subscriptionId,
      stripe_customer_id:      customerId,
      plan,
      status:             statusVal,
      current_period_end: periodEnd,
      updated_at:         new Date().toISOString(),
    }, { onConflict: 'restaurant_id' })

  // Mettre à jour le plan_id du restaurant
  await admin
    .from('restaurants')
    .update({ plan_id: plan, updated_at: new Date().toISOString() })
    .eq('id', restaurantId)
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const admin        = getAdmin()
  const restaurantId = stripeSub.metadata?.restaurant_id
  if (!restaurantId) return

  const priceId   = stripeSub.items.data[0]?.price.id ?? ''
  const plan      = planFromPriceId(priceId)
  const periodEnd = new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()

  // Mapper le statut Stripe vers le statut PilotResto
  const statusMap: Record<string, import('@/types').SubscriptionStatus> = {
    active:             'active',
    trialing:           'trialing',
    past_due:           'past_due',
    canceled:           'canceled',
    unpaid:             'past_due',
    incomplete:         'past_due',
    incomplete_expired: 'canceled',
    paused:             'past_due',
  }
  const status = statusMap[stripeSub.status] ?? 'past_due'

  await admin
    .from('subscriptions')
    .update({
      plan,
      status,
      current_period_end: periodEnd,
      updated_at:         new Date().toISOString(),
    })
    .eq('restaurant_id', restaurantId)

  await admin
    .from('restaurants')
    .update({ plan_id: plan, updated_at: new Date().toISOString() })
    .eq('id', restaurantId)
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const admin        = getAdmin()
  const restaurantId = stripeSub.metadata?.restaurant_id
  if (!restaurantId) return

  await admin
    .from('subscriptions')
    .update({
      status:     'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('restaurant_id', restaurantId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const admin      = getAdmin()
  const customerId = invoice.customer as string | null
  if (!customerId) return

  // Retrouver le restaurant via stripe_customer_id
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('restaurant_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!subscription) return

  await admin
    .from('subscriptions')
    .update({
      status:     'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('restaurant_id', subscription.restaurant_id)

  // Récupérer l'email du propriétaire + nom du restaurant pour l'alerte
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name')
    .eq('id', subscription.restaurant_id)
    .single()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('restaurant_id', subscription.restaurant_id)
    .eq('role', 'owner')
    .single()

  if (profile && restaurant) {
    const { data: userData } = await admin.auth.admin.getUserById(profile.id)
    const email = userData?.user?.email
    if (email) await sendPaymentFailedAlert(email, restaurant.name)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const admin      = getAdmin()
  const customerId = invoice.customer as string | null
  if (!customerId) return

  // Ne réactiver que si le statut était 'past_due'
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('restaurant_id, status')
    .eq('stripe_customer_id', customerId)
    .single()

  if (subscription?.status === 'past_due') {
    await admin
      .from('subscriptions')
      .update({
        status:     'active',
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', subscription.restaurant_id)
  }
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const stripe    = getStripe()
  const rawBody   = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  // Vérification de la signature — OBLIGATOIRE en production
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[Stripe Webhook] Signature invalide:', msg)
    return NextResponse.json({ error: `Webhook signature error: ${msg}` }, { status: 400 })
  }

  // Traitement des événements
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_succeeded':
      case 'invoice.paid':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        // Événements non gérés — retourner 200 pour éviter les re-tentatives Stripe
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Handler error'
    console.error(`[Stripe Webhook] Erreur sur ${event.type}:`, msg)
    // Retourner 200 pour ne pas déclencher des re-tentatives Stripe
    return NextResponse.json({ received: true, warning: msg })
  }
}
