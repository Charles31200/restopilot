import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status:        z.enum(['pending', 'validated', 'paid']).optional(),
  supplier_name: z.string().nullable().optional(),
  amount:        z.number().min(0).optional(),
  vat_amount:    z.number().min(0).optional(),
  invoice_date:  z.string().nullable().optional(),
  due_date:      z.string().nullable().optional(),
})

async function getCtx(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null }
  const { data: inv } = await supabase
    .from('invoices').select('id').eq('id', id).eq('restaurant_id', restaurantId).single()
  if (!inv) return { supabase, restaurantId: null }
  return { supabase, restaurantId }
}

/** PATCH /api/invoices/[id] — Modifier statut ou champs */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const body   = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('invoices').update(parsed.data).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}

/** DELETE /api/invoices/[id] */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
