import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getCtx(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null, employee: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id ?? null
  if (!restaurantId) return { supabase, restaurantId: null, employee: null }
  const { data: employee } = await supabase
    .from('employees').select('id').eq('id', id).eq('restaurant_id', restaurantId).single()
  return { supabase, restaurantId, employee }
}

/** Archiver un employé (soft delete : is_active = false) */
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, restaurantId, employee } = await getCtx(id)
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!employee)     return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })

  const { error } = await supabase
    .from('employees')
    .update({ is_active: false })
    .eq('id', id).eq('restaurant_id', restaurantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
