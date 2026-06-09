/**
 * POST /api/stripe/cancel
 * Annule l'abonnement à la fin de la période en cours (pas immédiatement).
 * L'accès reste actif jusqu'à current_period_end.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelSubscriptionAtPeriodEnd, reactivateSubscription } from '@/lib/stripe'

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
    .select('stripe_subscription_id')
    .eq('restaurant_id', restaurantId)
    .single()

  if (!subscription?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 422 })
  }

  try {
    await cancelSubscriptionAtPeriodEnd(subscription.stripe_subscription_id)
    return NextResponse.json({ success: true, message: 'Abonnement annulé à la fin de la période' })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 })
  }
}
