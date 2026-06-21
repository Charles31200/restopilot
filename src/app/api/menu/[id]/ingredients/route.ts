import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ingredientSchema = z.object({
  product_id: z.string().uuid('Produit requis'),
  quantity:   z.number().min(0.001, 'Quantité > 0'),
})

async function getCtx(menuItemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null }
  const { data: item } = await supabase
    .from('menu_items').select('id').eq('id', menuItemId).eq('restaurant_id', restaurantId).single()
  if (!item) return { supabase, restaurantId: null }
  return { supabase, restaurantId }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const { data: ingredients, error } = await supabase
    .from('menu_item_ingredients')
    .select('id, quantity, products ( id, name, unit )')
    .eq('menu_item_id', id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ingredients })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const body = await request.json()
  const parsed = ingredientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  // Verify product belongs to restaurant
  const { data: product } = await supabase
    .from('products').select('id').eq('id', parsed.data.product_id).eq('restaurant_id', restaurantId).single()
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  const { data: ingredient, error } = await supabase
    .from('menu_item_ingredients')
    .insert({ menu_item_id: id, ...parsed.data })
    .select('id, quantity, products ( id, name, unit )')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ingredient }, { status: 201 })
}
