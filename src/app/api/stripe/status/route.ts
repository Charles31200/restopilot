/**
 * GET /api/stripe/status
 * Retourne le statut d'abonnement du restaurant connecté.
 * Inclut cancel_at_period_end depuis Stripe (appel Stripe API si abonnement actif).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json(null)

  const info = await getSubscriptionStatus(restaurantId)
  return NextResponse.json(info)
}
