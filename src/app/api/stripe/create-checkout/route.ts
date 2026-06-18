/**
 * POST /api/stripe/create-checkout
 * Crée une Stripe Checkout Session et retourne l'URL de redirection.
 *
 * Body JSON : { priceId: string }
 * Retourne  : { url: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'

// Price IDs valides côté serveur (variables non-publiques pour la validation)
// La page pricing envoie le priceId choisi — on vérifie ici qu'il ressemble
// à un vrai Price ID Stripe (commence par "price_" et fait > 12 caractères).
function isRealPriceId(priceId: string): boolean {
  return priceId.startsWith('price_') && priceId.length > 12
}

export async function POST(request: NextRequest) {
  // ── Diagnostic env ────────────────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[checkout] STRIPE_SECRET_KEY non configurée')
    return NextResponse.json(
      { error: 'Stripe non configuré (clé manquante)' },
      { status: 503 }
    )
  }

  // ── Auth ──────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // ── Récupérer restaurant + abonnement actuel ──────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const restaurantId = profile?.restaurant_id
  if (!restaurantId) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('restaurant_id', restaurantId)
    .single()

  // ── Lire et valider le priceId ────────────────────────────────
  let body: { priceId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body.priceId) {
    return NextResponse.json({ error: 'priceId requis' }, { status: 400 })
  }

  // Détecter les valeurs de fallback (price_starter_monthly, price_pro_annual…)
  // qui signifient que les variables NEXT_PUBLIC_STRIPE_PRICE_* ne sont pas configurées.
  if (!isRealPriceId(body.priceId)) {
    console.error('[checkout] priceId invalide reçu:', body.priceId,
      '— Les variables NEXT_PUBLIC_STRIPE_PRICE_* ne sont probablement pas configurées sur Vercel.')
    return NextResponse.json(
      { error: 'Plan non disponible. Les prix Stripe ne sont pas encore configurés.' },
      { status: 503 }
    )
  }

  // ── Créer la session ─────────────────────────────────────────
  try {
    const url = await createCheckoutSession({
      priceId:          body.priceId,
      restaurantId,
      customerEmail:    user.email ?? '',
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue'
    // Log explicite pour Vercel Functions
    console.error('[checkout] Erreur Stripe:', message, {
      priceId:      body.priceId,
      restaurantId,
      hasCustomer:  !!subscription?.stripe_customer_id,
      appUrl:       process.env.NEXT_PUBLIC_APP_URL ?? '(non défini)',
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
