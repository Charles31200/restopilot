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

const productSchema = z.object({
  id:            z.string().uuid().optional(),      // présent = update
  name:          z.string().min(2, 'Nom requis (min 2 caractères)'),
  category:      z.string().nullable().optional(),
  unit:          z.enum(['kg', 'g', 'L', 'cl', 'piece', 'boite', 'carton']),
  buy_price:     z.coerce.number().min(0).default(0),
  stock_qty:     z.coerce.number().min(0).default(0),
  min_threshold: z.coerce.number().min(0).default(0),
  supplier_name: z.string().nullable().optional(),
})

// ── Calcul du statut stock ────────────────────────────────────

export type StockStatus = 'ok' | 'low' | 'critical'

export function getStockStatus(qty: number, threshold: number): StockStatus {
  if (threshold <= 0) return 'ok'
  if (qty < threshold)       return 'critical'
  if (qty < threshold * 2)   return 'low'
  return 'ok'
}

// ── GET /api/products ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search    = searchParams.get('search')   ?? ''
  const category  = searchParams.get('category') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const sortCol   = (searchParams.get('sort')    ?? 'name') as string
  const sortDir   = searchParams.get('dir')      === 'desc'
  const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10))
  const limit     = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))

  let query = supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (search)   query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)

  // Tri
  const validSorts = ['name', 'stock_qty', 'buy_price', 'category', 'supplier_name']
  const col = validSorts.includes(sortCol) ? sortCol : 'name'
  query = query.order(col, { ascending: !sortDir })

  const { data: allProducts, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtre statut côté serveur (champ calculé)
  const enriched = (allProducts ?? []).map(p => ({
    ...p,
    status: getStockStatus(p.stock_qty, p.min_threshold),
  }))

  const filtered = statusFilter
    ? enriched.filter(p => p.status === statusFilter)
    : enriched

  // Pagination
  const total    = filtered.length
  const products = filtered.slice((page - 1) * limit, page * limit)

  // Catégories uniques pour les filtres UI
  const categories = [...new Set(
    (allProducts ?? []).map(p => p.category).filter(Boolean)
  )].sort()

  return NextResponse.json({ products, total, categories })
}

// ── POST /api/products (créer ou modifier) ────────────────────

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { id, ...data } = parsed.data

  if (id) {
    // Mise à jour
    const { data: product, error } = await supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product })
  }

  // Création
  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...data, restaurant_id: restaurantId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product }, { status: 201 })
}
