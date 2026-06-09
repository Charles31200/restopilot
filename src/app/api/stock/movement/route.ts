import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Schéma ────────────────────────────────────────────────────

const movementSchema = z.object({
  product_id: z.string().uuid('Produit invalide'),
  type:       z.enum(['in', 'out', 'adjust', 'sale']),
  quantity:   z.coerce.number().refine(n => n !== 0, 'Quantité non nulle requise'),
  note:       z.string().optional(),
})

// ── POST /api/stock/movement ──────────────────────────────────
// Enregistre un mouvement de stock ET met à jour stock_qty du produit.

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id, id').eq('id', user.id).single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = movementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { product_id, type, quantity, note } = parsed.data

  // Vérifier que le produit appartient au restaurant
  const { data: product } = await supabase
    .from('products')
    .select('id, stock_qty, min_threshold, name, unit')
    .eq('id', product_id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  }

  // Calculer le nouveau stock
  // 'in' et 'adjust' → delta positif ou négatif selon la quantité passée
  // 'out' et 'sale' → soustraire en valeur absolue
  let delta: number
  if (type === 'in') {
    delta = Math.abs(quantity)
  } else if (type === 'out' || type === 'sale') {
    delta = -Math.abs(quantity)
  } else {
    // 'adjust' : la quantité est la nouvelle valeur absolue du stock
    delta = quantity - product.stock_qty
  }

  const newQty = Math.max(0, product.stock_qty + delta)

  // Mise à jour du stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', product_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Création du mouvement
  const { data: movement, error: movError } = await supabase
    .from('stock_movements')
    .insert({
      restaurant_id: profile.restaurant_id,
      product_id,
      type,
      quantity:    delta,
      note:        note ?? null,
      created_by:  profile.id,
    })
    .select()
    .single()

  if (movError) {
    return NextResponse.json({ error: movError.message }, { status: 500 })
  }

  // Alertes : stock passé en dessous du seuil ?
  const wentCritical =
    product.min_threshold > 0 &&
    product.stock_qty >= product.min_threshold &&
    newQty < product.min_threshold

  return NextResponse.json({
    movement,
    product: { ...product, stock_qty: newQty },
    wentCritical,
  })
}
