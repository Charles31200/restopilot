import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { InvoiceExtended } from '@/types/comptabilite'

const schema = z.object({
  supplier_name: z.string().nullable().optional(),
  amount:        z.number().min(0),        // HT
  vat_amount:    z.number().min(0).default(0),
  invoice_date:  z.string().nullable().optional(),
  due_date:      z.string().nullable().optional(),
  file_url:      z.string().nullable().optional(),
  status:        z.enum(['pending', 'validated', 'paid']).default('pending'),
  ocr_raw_text:  z.string().nullable().optional(),
})

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

function enrich(row: Record<string, unknown>): InvoiceExtended {
  const amount    = Number(row.amount)    ?? 0
  const vat       = Number(row.vat_amount) ?? 0
  return { ...(row as unknown as InvoiceExtended), total_ttc: +(amount + vat).toFixed(2) }
}

// ── GET /api/invoices ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { supabase, restaurantId } = await getCtx()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month  = searchParams.get('month')  ?? ''
  const status = searchParams.get('status') ?? ''

  let query = supabase
    .from('invoices').select('*')
    .eq('restaurant_id', restaurantId)
    .order('invoice_date', { ascending: false })

  if (month) {
    const [y, m] = month.split('-').map(Number)
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const last = new Date(y, m, 0).getDate()
    const to   = `${y}-${String(m).padStart(2, '0')}-${last}`
    query = query.gte('invoice_date', from).lte('invoice_date', to)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const invoices = (data ?? []).map(enrich)
  const totalHT  = +invoices.reduce((s, i) => s + i.amount,    0).toFixed(2)
  const totalVAT = +invoices.reduce((s, i) => s + i.vat_amount, 0).toFixed(2)

  return NextResponse.json({ invoices, totalHT, totalVAT })
}

// ── POST /api/invoices ────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getCtx()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({ ...parsed.data, restaurant_id: restaurantId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: enrich(data as unknown as Record<string, unknown>) }, { status: 201 })
}
