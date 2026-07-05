import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Helper partagé ────────────────────────────────────────────

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

// ── Schéma de validation ──────────────────────────────────────

const saleSchema = z.object({
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  total_revenue: z.coerce.number().min(0, 'CA ≥ 0'),
  covers:        z.coerce.number().int().min(0, 'Couverts ≥ 0').default(0),
  // source toujours 'manual' via ce formulaire
  items: z.array(z.object({
    menu_item_id: z.string().uuid().nullable().optional(),
    dish_name:    z.string().min(1),
    quantity:     z.coerce.number().int().min(1),
    unit_price:   z.coerce.number().min(0),
  })).optional().default([]),
})

// ── GET /api/sales ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const limit = Math.min(365, parseInt(searchParams.get('limit') ?? '90', 10))

  let query = supabase
    .from('sales')
    .select('id, date, total_revenue, covers, source, created_at')
    .eq('restaurant_id', restaurantId)
    .order('date', { ascending: false })
    .limit(limit)

  if (from) query = query.gte('date', from)
  if (to)   query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// ── POST /api/sales ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }

  const parsed = saleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('sales')
    .insert({
      restaurant_id: restaurantId,
      date:          parsed.data.date,
      total_revenue: parsed.data.total_revenue,
      covers:        parsed.data.covers,
      source:        'manual',
    })
    .select('id, date, total_revenue, covers, source, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enregistrer les lignes de vente (plats) pour le top plats / historique
  if (parsed.data.items.length > 0) {
    const saleItems = parsed.data.items.map(item => ({
      sale_id:       data.id,
      restaurant_id: restaurantId,
      recipe_id:     item.menu_item_id ?? null,
      dish_name:     item.dish_name,
      quantity_sold: item.quantity,
      unit_price:    item.unit_price,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
