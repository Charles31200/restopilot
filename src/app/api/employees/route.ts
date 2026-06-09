import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  id:           z.string().uuid().optional(),
  first_name:   z.string().min(1, 'Prénom requis'),
  last_name:    z.string().min(1, 'Nom requis'),
  role:         z.enum(['cuisinier', 'serveur', 'barman', 'plongeur', 'manager', 'autre']),
  contract_type: z.enum(['CDI', 'CDD', 'extra', 'apprenti']),
  hourly_rate:  z.number().min(0, 'Taux horaire requis'),
  weekly_hours: z.number().int().min(1).max(48).default(35),
  color:        z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').default('#3B82F6'),
  is_active:    z.boolean().default(true),
})

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

export async function GET() {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('first_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees: employees ?? [] })
}

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { id, ...data } = parsed.data

  if (id) {
    const { data: emp, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', id).eq('restaurant_id', restaurantId)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ employee: emp })
  }

  const { data: emp, error } = await supabase
    .from('employees')
    .insert({ ...data, restaurant_id: restaurantId })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employee: emp }, { status: 201 })
}
