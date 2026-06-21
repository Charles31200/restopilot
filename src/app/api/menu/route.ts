import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Uses existing `recipes` + `recipe_ingredients` tables.
// sell_price stored as DECIMAL — z.coerce.number() handles both
// string inputs ("12") and number inputs (12) from the form.

const menuItemSchema = z.object({
  dish_name:  z.string().min(1, 'Nom requis'),
  category:   z.string().nullable().optional(),
  sell_price: z.coerce.number().min(0, 'Prix ≥ 0'),
  is_active:  z.coerce.boolean().optional().default(true),
})

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

export async function GET() {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: items, error } = await supabase
    .from('recipes')
    .select(`
      id, dish_name, category, sell_price, is_active, created_at,
      recipe_ingredients ( id, quantity, product_id, product:products(id, name, unit) )
    `)
    .eq('restaurant_id', restaurantId)
    .order('category')
    .order('dish_name') as unknown as {
      data: Array<{
        id: string; dish_name: string; category: string | null
        sell_price: number; is_active: boolean; created_at: string
        recipe_ingredients: Array<{
          id: string; quantity: number; product_id: string
          product: { id: string; name: string; unit: string } | null
        }>
      }> | null
      error: { message: string } | null
    }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  console.log('[POST /api/menu] body reçu :', JSON.stringify(body))

  const parsed = menuItemSchema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    console.error('[POST /api/menu] Zod error :', JSON.stringify(flat))
    return NextResponse.json({ error: 'Données invalides', details: flat }, { status: 422 })
  }

  const { data: item, error } = await supabase
    .from('recipes')
    .insert({ ...parsed.data, restaurant_id: restaurantId })
    .select('id, dish_name, category, sell_price, is_active, created_at')
    .single()

  if (error) {
    console.error('[POST /api/menu] Supabase error :', error.message, error.code, error.details)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: { ...item, recipe_ingredients: [] } }, { status: 201 })
}
