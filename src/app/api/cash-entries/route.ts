import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Helper auth ───────────────────────────────────────────────

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

// ── Schéma de validation ──────────────────────────────────────

const cashEntrySchema = z.object({
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  amount: z.coerce.number().min(0, 'Montant ≥ 0'),
  period: z.enum(['day', 'week']).default('day'),
})

// ── GET /api/cash-entries?date=&period= ───────────────────────

export async function GET(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date       = searchParams.get('date')
  const periodParam = searchParams.get('period')
  const period      = periodParam === 'day' || periodParam === 'week' ? periodParam : null

  let query = supabase
    .from('cash_entries')
    .select('id, date, amount, period, note, created_at')
    .eq('restaurant_id', restaurantId)
    .order('date', { ascending: false })
    .limit(30)

  if (date)   query = query.eq('date', date)
  if (period) query = query.eq('period', period)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// ── POST /api/cash-entries ─────────────────────────────────────

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }

  const parsed = cashEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('cash_entries')
    .insert({
      restaurant_id: restaurantId,
      date:          parsed.data.date,
      amount:        parsed.data.amount,
      period:        parsed.data.period,
    })
    .select('id, date, amount, period, note, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
