import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Auth helper ────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, restaurantId: null, role: null, employeeId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role, employee_id')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    restaurantId: profile?.restaurant_id ?? null,
    role:         profile?.role          ?? null,
    employeeId:   profile?.employee_id   ?? null,
  }
}

function startOfDayISO(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfDayISO(date: Date): string {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

// ── GET /api/time-logs — pointages du jour pour l'employé connecté ──

export async function GET(_req: NextRequest) {
  const { supabase, restaurantId, role, employeeId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (role !== 'staff' || !employeeId) {
    return NextResponse.json({ error: 'Réservé aux comptes employé' }, { status: 403 })
  }

  const now = new Date()
  const { data, error } = await supabase
    .from('time_logs')
    .select('id, shift_id, clock_in, clock_out, created_at')
    .eq('restaurant_id', restaurantId)
    .eq('employee_id', employeeId)
    .gte('created_at', startOfDayISO(now))
    .lte('created_at', endOfDayISO(now))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log: data ?? null })
}

// ── POST /api/time-logs — pointer l'arrivée ─────────────────────

const clockInSchema = z.object({
  shift_id: z.string().uuid().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const { supabase, restaurantId, role, employeeId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (role !== 'staff' || !employeeId) {
    return NextResponse.json({ error: 'Réservé aux comptes employé' }, { status: 403 })
  }

  const body   = await req.json().catch(() => ({}))
  const parsed = clockInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  // Empêche un double pointage d'arrivée sans départ entre les deux
  const now = new Date()
  const { data: openLog } = await supabase
    .from('time_logs')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('employee_id', employeeId)
    .is('clock_out', null)
    .gte('created_at', startOfDayISO(now))
    .maybeSingle()

  if (openLog) {
    return NextResponse.json({ error: 'Vous êtes déjà pointé. Pointez votre départ avant de repointer une arrivée.' }, { status: 409 })
  }

  const { data: log, error } = await supabase
    .from('time_logs')
    .insert({
      restaurant_id: restaurantId,
      employee_id:   employeeId,
      shift_id:      parsed.data.shift_id ?? null,
      clock_in:      now.toISOString(),
    })
    .select('id, shift_id, clock_in, clock_out, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log }, { status: 201 })
}

// ── PATCH /api/time-logs — pointer le départ ────────────────────

const clockOutSchema = z.object({
  id: z.string().uuid(),
})

export async function PATCH(req: NextRequest) {
  const { supabase, restaurantId, role, employeeId } = await getCurrentUser()
  if (!restaurantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (role !== 'staff' || !employeeId) {
    return NextResponse.json({ error: 'Réservé aux comptes employé' }, { status: 403 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = clockOutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'id invalide' }, { status: 422 })
  }

  // Vérifie que ce pointage appartient bien à cet employé avant de le clôturer
  const { data: existing } = await supabase
    .from('time_logs')
    .select('id, clock_out')
    .eq('id', parsed.data.id)
    .eq('restaurant_id', restaurantId)
    .eq('employee_id', employeeId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Pointage introuvable' }, { status: 404 })
  }
  if (existing.clock_out) {
    return NextResponse.json({ error: 'Ce pointage est déjà clôturé' }, { status: 409 })
  }

  const { data: log, error } = await supabase
    .from('time_logs')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select('id, shift_id, clock_in, clock_out, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log })
}
