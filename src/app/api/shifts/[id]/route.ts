import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  start_time: z.string().datetime().optional(),
  end_time:   z.string().datetime().optional(),
  position:   z.string().nullable().optional(),
  status:     z.enum(['planned', 'confirmed', 'done', 'absent']).optional(),
  note:       z.string().nullable().optional(),
})

async function getCtx(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null }
  // Vérifier que le shift appartient au restaurant
  const { data: shift } = await supabase
    .from('shifts').select('id').eq('id', id).eq('restaurant_id', restaurantId).single()
  if (!shift) return { supabase, restaurantId: null }
  return { supabase, restaurantId }
}

/** PUT /api/shifts/[id] */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const body   = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .update(parsed.data)
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift })
}

/** DELETE /api/shifts/[id] */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const { error } = await supabase
    .from('shifts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
