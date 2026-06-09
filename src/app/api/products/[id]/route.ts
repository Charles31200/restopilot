import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── DELETE /api/products/[id] ─────────────────────────────────
// Next.js 16 : params est une Promise

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  // Vérifier que le produit appartient bien à ce restaurant
  const { data: product } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  }

  // Supprimer les recipe_ingredients liés (pour éviter les FK violations)
  await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('product_id', id)

  // Supprimer le produit
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, deleted: product.name })
}

// ── GET /api/products/[id] ────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  }

  return NextResponse.json({ product })
}
