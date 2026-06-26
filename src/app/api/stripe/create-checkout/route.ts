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
  return priceId.startsWith('price_') && priceId.length > 25
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

  // ── Valider NEXT_PUBLIC_APP_URL ──────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl || appUrl.includes('localhost')) {
    console.error('[checkout] NEXT_PUBLIC_APP_URL non défini ou localhost:', appUrl,
      '— Stripe live mode rejette les URLs localhost pour success_url.')
    return NextResponse.json(
      { error: 'Configuration serveur incomplète (APP_URL manquant). Contactez le support.' },
      { status: 503 }
    )
  }

  // ── Créer la session ─────────────────────────────────────────
  console.log('[checkout] priceId reçu:', body.priceId)
  try {
    const url = await createCheckoutSession({
      priceId:          body.priceId,
      restaurantId,
      customerEmail:    user.email ?? '',
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const error   = err as { message?: string; type?: string; code?: string; decline_code?: string; param?: string }
    const message = error?.message ?? 'Erreur Stripe inconnue'
    console.error('[checkout] Stripe error details:', {
      message:        error?.message,
      type:           error?.type,
      code:           error?.code,
      decline_code:   error?.decline_code,
      param:          error?.param,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 14),
      priceId:        body.priceId,
      appUrl:         process.env.NEXT_PUBLIC_APP_URL,
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
