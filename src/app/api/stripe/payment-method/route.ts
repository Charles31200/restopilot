/**
 * GET /api/stripe/payment-method
 * Retourne le plan et le statut carte bancaire de l'utilisateur connecté.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, has_payment_method')
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (!sub) {
    return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    plan:              sub.plan,
    status:            sub.status,
    has_payment_method: sub.has_payment_method ?? false,
  })
}
