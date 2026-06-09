/**
 * POST /api/stripe/portal
 * Crée une session Stripe Billing Portal et retourne l'URL.
 * Le restaurateur peut y modifier sa CB, télécharger ses factures,
 * changer de plan ou annuler son abonnement.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('restaurant_id', restaurantId)
    .single()

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Aucun abonnement Stripe actif. Souscrivez d\'abord un plan.' },
      { status: 422 }
    )
  }

  try {
    const url = await createBillingPortalSession({
      stripeCustomerId: subscription.stripe_customer_id,
      returnPath:       '/parametres/abonnement',
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
