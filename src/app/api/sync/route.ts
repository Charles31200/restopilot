/**
 * POST /api/sync
 * Synchronisation manuelle des ventes pour le restaurant de l'utilisateur connecté.
 *
 * Body JSON optionnel : { dates?: string[] }   // YYYY-MM-DD[], défaut = aujourd'hui
 *
 * Retourne : { success, salesCreated, itemsProcessed, stockUpdated, errors[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncRestaurant } from '@/lib/integrations/sync-engine'

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  // Dates optionnelles
  let dates: string[] | undefined
  try {
    const body = await request.json()
    if (Array.isArray(body?.dates)) dates = body.dates
  } catch { /* body vide ou non-JSON — utiliser la date du jour */ }

  // Lancer la sync
  const result = await syncRestaurant(restaurantId, dates)

  return NextResponse.json(result, { status: result.success ? 200 : 422 })
}
