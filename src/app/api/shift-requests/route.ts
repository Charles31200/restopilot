import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Auth helper ────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, restaurantId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  return { supabase, user, restaurantId: profile?.restaurant_id ?? null }
}

// ── Schémas de validation ──────────────────────────────────────

const createSchema = z.object({
  employee_id:     z.string().uuid('employee_id invalide'),
  shift_id:        z.string().uuid('shift_id invalide'),
  type:            z.literal('modify'),
  requested_start: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM attendu pour requested_start'),
  requested_end:   z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM attendu pour requested_end'),
  requested_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD attendu pour requested_date'),
  reason:          z.string().max(500).optional(),
})

const patchSchema = z.object({
  id:              z.string().uuid('id invalide'),
  status:          z.enum(['approved', 'rejected']),
  manager_note:    z.string().max(500).optional(),
  requested_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  requested_end:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  shift_id:        z.string().uuid().optional(),
})

// ── GET /api/shift-requests ───────────────────────────────────
// Retourne toutes les demandes pending du restaurant connecté,
// avec join sur employees (first_name, last_name, color)
// et shifts (start_time, end_time).

export async function GET(_req: NextRequest) {
  const { supabase, restaurantId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('shift_requests')
    .select(`
      id,
      employee_id,
      shift_id,
      type,
      requested_start,
      requested_end,
      requested_date,
      reason,
      status,
      manager_note,
      created_at,
      employee:employees ( id, first_name, last_name, color ),
      shift:shifts ( id, start_time, end_time, position )
    `)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

// ── POST /api/shift-requests ──────────────────────────────────
// Crée une nouvelle demande de modification de créneau.

export async function POST(req: NextRequest) {
  const { supabase, restaurantId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { employee_id, shift_id, type, requested_start, requested_end, requested_date, reason } = parsed.data

  // Vérifier que le shift appartient au restaurant
  const { data: shift } = await supabase
    .from('shifts')
    .select('id')
    .eq('id', shift_id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!shift) {
    return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 })
  }

  // Bloquer les doublons : une seule demande pending par shift
  const { data: existing } = await supabase
    .from('shift_requests')
    .select('id')
    .eq('shift_id', shift_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Une demande est déjà en attente pour ce créneau' },
      { status: 409 }
    )
  }

  const { data: request, error } = await supabase
    .from('shift_requests')
    .insert({
      restaurant_id:   restaurantId,
      employee_id,
      shift_id,
      type,
      requested_start,
      requested_end,
      requested_date,
      reason:          reason ?? null,
      status:          'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request }, { status: 201 })
}

// ── PATCH /api/shift-requests ─────────────────────────────────
// Approuve ou refuse une demande.
// Si approved et type === 'modify', met à jour le shift.

export async function PATCH(req: NextRequest) {
  const { supabase, restaurantId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { id, status, manager_note, requested_start, requested_end, shift_id } = parsed.data

  // Récupérer la demande et vérifier l'appartenance
  const { data: sr } = await supabase
    .from('shift_requests')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (!sr) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  if (sr.status !== 'pending') {
    return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 409 })
  }

  // Si approuvé et type modify → mettre à jour le shift
  if (status === 'approved' && sr.type === 'modify') {
    const targetShiftId = shift_id        ?? sr.shift_id
    const newStart      = requested_start ?? sr.requested_start
    const newEnd        = requested_end   ?? sr.requested_end
    const date          = sr.requested_date

    const { error: shiftErr } = await supabase
      .from('shifts')
      .update({
        start_time: `${date}T${newStart}:00`,
        end_time:   `${date}T${newEnd}:00`,
      })
      .eq('id', targetShiftId)
      .eq('restaurant_id', restaurantId)

    if (shiftErr) {
      return NextResponse.json({ error: shiftErr.message }, { status: 500 })
    }
  }

  // Mettre à jour le statut de la demande
  const { data: updated, error } = await supabase
    .from('shift_requests')
    .update({
      status,
      manager_note: manager_note ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: updated })
}
