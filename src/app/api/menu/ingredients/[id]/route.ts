import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verify this ingredient belongs to a recipe owned by this restaurant
  const { data: ing } = await supabase
    .from('recipe_ingredients')
    .select('id, recipe_id, recipes!inner(restaurant_id)')
    .eq('id', id)
    .single() as unknown as {
      data: { id: string; recipe_id: string; recipes: { restaurant_id: string } } | null
      error: unknown
    }

  if (!ing || ing.recipes?.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  const { error } = await supabase.from('recipe_ingredients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
