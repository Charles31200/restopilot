import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const menuItemSchema = z.object({
  name:        z.string().min(1, 'Nom requis'),
  category:    z.string().min(1, 'Catégorie requise'),
  price:       z.number().min(0, 'Prix ≥ 0'),
  description: z.string().optional().nullable(),
  is_active:   z.boolean().optional().default(true),
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
    .from('menu_items')
    .select(`
      *,
      menu_item_ingredients (
        id, quantity,
        products ( id, name, unit )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('category')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = menuItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({ ...parsed.data, restaurant_id: restaurantId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item }, { status: 201 })
}
