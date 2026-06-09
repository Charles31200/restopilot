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

export async function POST(request: NextRequest) {
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

  // ── Lire le priceId ──────────────────────────────────────────
  const body = await request.json() as { priceId?: string }
  if (!body.priceId) {
    return NextResponse.json({ error: 'priceId requis' }, { status: 400 })
  }

  // ── Créer la session ─────────────────────────────────────────
  try {
    const url = await createCheckoutSession({
      priceId:         body.priceId,
      restaurantId,
      customerEmail:   user.email ?? '',
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
