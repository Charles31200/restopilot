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

  // Verify this ingredient belongs to a menu_item owned by this restaurant
  const { data: ing } = await supabase
    .from('menu_item_ingredients')
    .select('id, menu_items!inner(restaurant_id)')
    .eq('id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!ing || (ing.menu_items as any)?.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  const { error } = await supabase.from('menu_item_ingredients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
