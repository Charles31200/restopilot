import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ingredientSchema = z.object({
  product_id: z.string().uuid('Produit requis'),
  quantity:   z.number().min(0.001, 'Quantité > 0'),
})

async function getCtx(recipeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null }
  // verify recipe belongs to restaurant
  const { data: recipe } = await supabase
    .from('recipes').select('id').eq('id', recipeId).eq('restaurant_id', restaurantId).single()
  if (!recipe) return { supabase, restaurantId: null }
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
    .from('recipe_ingredients')
    .select('id, quantity, product_id, product:products(id, name, unit)')
    .eq('recipe_id', id) as unknown as {
      data: Array<{
        id: string; quantity: number; product_id: string
        product: { id: string; name: string; unit: string } | null
      }> | null
      error: { message: string } | null
    }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize to match MenuIngredient shape expected by RecipeSheetModal
  const normalized = (ingredients ?? []).map(i => ({
    id:       i.id,
    quantity: i.quantity,
    products: i.product,
  }))

  return NextResponse.json({ ingredients: normalized })
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
    .from('products').select('id, name, unit')
    .eq('id', parsed.data.product_id).eq('restaurant_id', restaurantId).single()
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  const { data: ing, error } = await supabase
    .from('recipe_ingredients')
    .insert({ recipe_id: id, product_id: parsed.data.product_id, quantity: parsed.data.quantity })
    .select('id, quantity, product_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ingredient: { id: ing.id, quantity: ing.quantity, products: product },
  }, { status: 201 })
}
