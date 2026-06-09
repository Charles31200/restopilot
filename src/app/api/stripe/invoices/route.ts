/**
 * GET /api/stripe/invoices
 * Retourne la liste des factures payées du client Stripe.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCustomerInvoices } from '@/lib/stripe'

export async function GET() {
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
    return NextResponse.json({ invoices: [] })
  }

  try {
    const invoices = await getCustomerInvoices(subscription.stripe_customer_id)
    return NextResponse.json({ invoices })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur Stripe' }, { status: 500 })
  }
}
