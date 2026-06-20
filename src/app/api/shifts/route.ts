import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  weekStringToMonday,
  getWeekDays,
  toISODate,
  calcHours,
  extractTime,
} from '@/lib/utils/week-utils'
import {
  calculateShiftCost,
  calcNightHours,
  HCR,
} from '@/lib/utils/hcr-rules'
import type { WeekData, EmployeeWeeklyStats, ShiftWithEmployee } from '@/types/planning'
import type { Employee } from '@/types'

// ── Schéma de création ────────────────────────────────────────

const shiftSchema = z.object({
  employee_id: z.string().uuid('Employé requis'),
  // Accept both "2026-06-14T10:00:00" (local) and "2026-06-14T10:00:00Z" (UTC)
  start_time:  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Format timestamp invalide'),
  end_time:    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Format timestamp invalide'),
  position:    z.string().nullable().optional(),
  status:      z.enum(['planned', 'confirmed', 'done', 'absent']).default('planned'),
  note:        z.string().nullable().optional(),
})

async function getRestaurantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, restaurantId: null, userId: null }
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  return { supabase, restaurantId: profile?.restaurant_id ?? null, userId: user.id }
}

// ── Calcul des stats hebdomadaires ────────────────────────────

function buildWeeklyStats(
  employees: Employee[],
  shifts:    ShiftWithEmployee[]
): { stats: EmployeeWeeklyStats[]; totalCost: number } {
  const statsMap = new Map<string, EmployeeWeeklyStats>()

  for (const emp of employees) {
    statsMap.set(emp.id, {
      employee:     emp,
      plannedHours: 0,
      normalHours:  0,
      overtime25:   0,
      overtime50:   0,
      nightHours:   0,
      sundayHours:  0,
      weeklyCost:   0,
    })
  }

  // Accumuler heures + nuit + dimanche
  for (const shift of shifts) {
    const st = statsMap.get(shift.employee_id)
    if (!st) continue

    const startStr = extractTime(shift.start_time)
    const endStr   = extractTime(shift.end_time)
    const hours    = calcHours(startStr, endStr)
    const night    = calcNightHours(startStr, endStr)
    const isSun    = new Date(shift.start_time).getDay() === 0

    st.plannedHours += hours
    st.nightHours   += night
    if (isSun) st.sundayHours += hours

    // Coût du créneau
    const cost = calculateShiftCost(
      shift.employee.hourly_rate,
      startStr,
      endStr,
      new Date(shift.start_time)
    )
    st.weeklyCost += cost.totalCost
  }

  // Calculer heures normales / heures sup
  for (const st of statsMap.values()) {
    const h = st.plannedHours
    st.normalHours = Math.min(h, HCR.WEEKLY_NORMAL_HOURS)
    if (h > HCR.WEEKLY_NORMAL_HOURS) {
      st.overtime25 = Math.min(h - HCR.WEEKLY_NORMAL_HOURS, HCR.OT_THRESHOLD_1 - HCR.WEEKLY_NORMAL_HOURS)
    }
    if (h > HCR.OT_THRESHOLD_1) {
      st.overtime50 = h - HCR.OT_THRESHOLD_1
    }
    const empRate = st.employee.hourly_rate
    const otSupplement = st.overtime25 * empRate * (HCR.OT_RATE_1 - 1)
                       + st.overtime50 * empRate * (HCR.OT_RATE_2 - 1)
    st.weeklyCost = +(st.weeklyCost + otSupplement).toFixed(2)
  }

  const totalCost = Array.from(statsMap.values()).reduce((s, x) => s + x.weeklyCost, 0)
  return { stats: Array.from(statsMap.values()), totalCost: +totalCost.toFixed(2) }
}

// ── GET /api/shifts?week=2026-W23 ────────────────────────────

export async function GET(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get('week') ?? ''

  // Valider le format
  const weekMatch = weekParam.match(/^(\d{4})-W(\d{2})$/)
  if (!weekMatch) {
    return NextResponse.json({ error: 'Paramètre week invalide (format: YYYY-WNN)' }, { status: 422 })
  }

  const weekDays = getWeekDays(weekParam)
  const fromDate = toISODate(weekDays[0])
  const toDate   = toISODate(weekDays[6])

  // Récupérer les créneaux de la semaine
  const { data: rawShifts, error: shiftErr } = await supabase
    .from('shifts')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .gte('start_time', `${fromDate}T00:00:00`)
    .lte('start_time', `${toDate}T23:59:59`)
    .order('start_time')

  if (shiftErr) return NextResponse.json({ error: shiftErr.message }, { status: 500 })

  // Récupérer les employés actifs
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('first_name')

  const empMap = new Map((employees ?? []).map(e => [e.id, e]))

  const shifts: ShiftWithEmployee[] = (rawShifts ?? []).map(s => ({
    ...s,
    employee: empMap.get(s.employee_id) ?? {
      id: s.employee_id, first_name: '?', last_name: '', role: 'autre',
      color: '#94A3B8', hourly_rate: 0, contract_type: 'CDI',
    },
  }))

  const { stats: weeklyStats, totalCost } = buildWeeklyStats(employees ?? [], shifts)

  // CA de la semaine (pour le % masse salariale)
  const { data: weekSales } = await supabase
    .from('sales')
    .select('total_revenue')
    .eq('restaurant_id', restaurantId)
    .gte('date', fromDate)
    .lte('date', toDate)

  const weekRevenue = weekSales?.reduce((s, r) => s + r.total_revenue, 0) ?? null

  const weekData: WeekData = {
    week:       weekParam,
    weekDates:  weekDays.map(toISODate),
    shifts,
    employees:  employees ?? [],
    weeklyStats,
    totalCost,
    weekRevenue: weekRevenue && weekRevenue > 0 ? weekRevenue : null,
  }

  return NextResponse.json(weekData)
}

// ── POST /api/shifts ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { supabase, restaurantId } = await getRestaurantId()
  if (!restaurantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await request.json()
  const parsed = shiftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 422 })
  }

  // Vérifier que l'employé appartient au restaurant
  const { data: emp } = await supabase
    .from('employees').select('id')
    .eq('id', parsed.data.employee_id).eq('restaurant_id', restaurantId).single()
  if (!emp) return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({ ...parsed.data, restaurant_id: restaurantId })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shift }, { status: 201 })
}
