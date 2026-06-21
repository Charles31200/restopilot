import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  category:    z.string().min(1).optional(),
  price:       z.number().min(0).optional(),
  description: z.string().nullable().optional(),
  is_active:   z.boolean().optional(),
})

async function getCtx(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null }
  const { data: item } = await supabase
    .from('menu_items').select('id').eq('id', id).eq('restaurant_id', restaurantId).single()
  if (!item) return { supabase, restaurantId: null }
  return { supabase, restaurantId }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { data: item, error } = await supabase
    .from('menu_items')
    .update(parsed.data)
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item })
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 401 })

  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
