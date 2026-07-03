import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Helpers ────────────────────────────────────────────────────

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null }
}

// ── Schémas ────────────────────────────────────────────────────

const createSchema = z.object({
  shift_id:       z.string().uuid(),
  employee_id:    z.string().uuid(),
  proposed_start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  proposed_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  reason:         z.string().max(500).optional(),
})

const patchSchema = z.object({
  request_id:   z.string().uuid(),
  action:       z.enum(['approve', 'reject']),
  manager_note: z.string().max(500).optional(),
})

// ── GET /api/shift-requests — demandes pending du restaurant ───

export async function GET(_req: NextRequest) {
  const { supabase, restaurantId } = await getAuth()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('shift_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name, role, color),
      shift:shifts(id, start_time, end_time, position)
    `)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

// ── POST /api/shift-requests — créer une demande ──────────────

export async function POST(req: NextRequest) {
  const { supabase, restaurantId } = await getAuth()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  // Vérifier que le shift appartient bien au restaurant
  const { data: shift } = await supabase
    .from('shifts').select('id')
    .eq('id', parsed.data.shift_id).eq('restaurant_id', restaurantId).single()
  if (!shift) return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 })

  // Vérifier qu'il n'y a pas déjà une demande pending pour ce shift
  const { data: existing } = await supabase
    .from('shift_requests')
    .select('id')
    .eq('shift_id', parsed.data.shift_id)
    .eq('status', 'pending')
    .single()
  if (existing) {
    return NextResponse.json({ error: 'Une demande est déjà en attente pour ce créneau' }, { status: 409 })
  }

  const { data: request, error } = await supabase
    .from('shift_requests')
    .insert({
      restaurant_id:  restaurantId,
      shift_id:       parsed.data.shift_id,
      employee_id:    parsed.data.employee_id,
      proposed_start: parsed.data.proposed_start,
      proposed_end:   parsed.data.proposed_end,
      reason:         parsed.data.reason ?? null,
      status:         'pending',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request }, { status: 201 })
}

// ── PATCH /api/shift-requests — approuver ou refuser ─────────

export async function PATCH(req: NextRequest) {
  const { supabase, restaurantId } = await getAuth()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  const { request_id, action, manager_note } = parsed.data

  // Récupérer la demande et vérifier qu'elle appartient au restaurant
  const { data: sr } = await supabase
    .from('shift_requests').select('*')
    .eq('id', request_id).eq('restaurant_id', restaurantId).single()
  if (!sr) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (sr.status !== 'pending') {
    return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 409 })
  }

  // Si approuvé → mettre à jour le shift
  if (action === 'approve') {
    const { error: shiftErr } = await supabase
      .from('shifts')
      .update({ start_time: sr.proposed_start, end_time: sr.proposed_end })
      .eq('id', sr.shift_id).eq('restaurant_id', restaurantId)
    if (shiftErr) return NextResponse.json({ error: shiftErr.message }, { status: 500 })
  }

  // Mettre à jour le statut de la demande
  const { data: updated, error } = await supabase
    .from('shift_requests')
    .update({
      status:       action === 'approve' ? 'approved' : 'rejected',
      manager_note: manager_note ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', request_id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: updated })
}
