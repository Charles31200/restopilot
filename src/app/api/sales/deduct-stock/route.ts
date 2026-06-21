import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity:     z.number().int().min(1),
  })).min(1),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { items } = parsed.data
  const warnings: string[] = []

  for (const { menu_item_id, quantity } of items) {
    // Fetch ingredients for this menu item
    const { data: ingredients } = await supabase
      .from('menu_item_ingredients')
      .select('product_id, quantity, products ( name, stock_qty, unit )')
      .eq('menu_item_id', menu_item_id)

    if (!ingredients?.length) continue

    for (const ing of ingredients) {
      const product = ing.products as unknown as { name: string; stock_qty: number; unit: string } | null
      if (!product) continue

      const deductQty = ing.quantity * quantity
      const newQty = Math.max(0, product.stock_qty - deductQty)

      const { error } = await supabase
        .from('products')
        .update({ stock_qty: newQty })
        .eq('id', ing.product_id)
        .eq('restaurant_id', restaurantId)

      if (!error) {
        // Record movement
        await supabase.from('stock_movements').insert({
          product_id:    ing.product_id,
          restaurant_id: restaurantId,
          type:          'sale',
          quantity:      -deductQty,
          note:          `Vente × ${quantity}`,
        })

        if (newQty === 0 && product.stock_qty > 0) {
          warnings.push(`${product.name} : stock épuisé`)
        }
      }
    }
  }

  return NextResponse.json({ success: true, warnings })
}
