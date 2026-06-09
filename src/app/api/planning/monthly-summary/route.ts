import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  extractTime,
  calcHours,
  formatMonthLabel,
} from '@/lib/utils/week-utils'
import {
  calculateShiftCost,
  calcNightHours,
  HCR,
} from '@/lib/utils/hcr-rules'
import type { MonthlyPlanningData, EmployeeMonthlyStats } from '@/types/planning'
import type { Employee } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month') ?? ''

  const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/)
  if (!monthMatch) {
    return NextResponse.json({ error: 'Paramètre month invalide (format: YYYY-MM)' }, { status: 422 })
  }

  const [, yearStr, monthStr] = monthMatch
  const year  = parseInt(yearStr)
  const month = parseInt(monthStr)

  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month, 0).getDate()
  const toDate   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  // Récupérer tous les créneaux du mois
  const { data: rawShifts, error: shiftErr } = await supabase
    .from('shifts')
    .select('*, employees(id, first_name, last_name, role, hourly_rate, color, contract_type, weekly_hours)')
    .eq('restaurant_id', restaurantId)
    .gte('start_time', `${fromDate}T00:00:00`)
    .lte('start_time', `${toDate}T23:59:59`)
    .order('start_time')

  if (shiftErr) return NextResponse.json({ error: shiftErr.message }, { status: 500 })

  // Récupérer tous les employés actifs (pour inclure ceux sans créneau)
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('first_name')

  const empMap = new Map<string, Employee>()
  for (const emp of employees ?? []) empMap.set(emp.id, emp)

  // Construire les stats par employé
  const statsMap = new Map<string, EmployeeMonthlyStats>()

  // Accumuler heures hebdomadaires pour les heures sup
  // On groupe les shifts par semaine × employé
  const weeklyHoursMap = new Map<string, number>()  // `${empId}_${weekStr}` → heures

  for (const shift of rawShifts ?? []) {
    const emp = empMap.get(shift.employee_id) ?? (shift as any).employees
    if (!emp) continue

    if (!statsMap.has(emp.id)) {
      statsMap.set(emp.id, {
        employee:       emp,
        totalHours:     0,
        normalHours:    0,
        overtime25:     0,
        overtime50:     0,
        nightHours:     0,
        sundayHours:    0,
        nightBonus:     0,
        sundayBonus:    0,
        overtimeBonus:  0,
        estimatedGross: 0,
      })
    }

    const st   = statsMap.get(emp.id)!
    const startT = extractTime(shift.start_time)
    const endT   = extractTime(shift.end_time)
    const hours  = calcHours(startT, endT)
    const night  = calcNightHours(startT, endT)
    const isSun  = new Date(shift.start_time).getDay() === 0

    st.totalHours  += hours
    st.nightHours  += night
    if (isSun) st.sundayHours += hours

    const cost = calculateShiftCost(emp.hourly_rate, startT, endT, new Date(shift.start_time))
    st.nightBonus   += cost.nightSurcharge
    st.sundayBonus  += cost.sundaySurcharge
    st.estimatedGross += cost.totalCost

    // Heures hebdo pour calculer les heures sup
    const shiftDate = new Date(shift.start_time)
    shiftDate.setHours(0, 0, 0, 0)
    const dayNum = shiftDate.getDay() || 7  // 1=Lun
    const monday = new Date(shiftDate)
    monday.setDate(shiftDate.getDate() - dayNum + 1)
    const weekKey = `${emp.id}_${monday.toISOString().split('T')[0]}`
    weeklyHoursMap.set(weekKey, (weeklyHoursMap.get(weekKey) ?? 0) + hours)
  }

  // Calculer les heures normales / heures sup par employé
  for (const st of statsMap.values()) {
    // Reconstituer les semaines de cet employé
    const empWeekHours = Array.from(weeklyHoursMap.entries())
      .filter(([k]) => k.startsWith(st.employee.id + '_'))
      .map(([, h]) => h)

    for (const weekH of empWeekHours) {
      const norm  = Math.min(weekH, HCR.WEEKLY_NORMAL_HOURS)
      const ot25  = Math.max(0, Math.min(weekH - HCR.WEEKLY_NORMAL_HOURS, HCR.OT_THRESHOLD_1 - HCR.WEEKLY_NORMAL_HOURS))
      const ot50  = Math.max(0, weekH - HCR.OT_THRESHOLD_1)
      st.normalHours += norm
      st.overtime25  += ot25
      st.overtime50  += ot50

      const rate = st.employee.hourly_rate
      st.overtimeBonus += ot25 * rate * (HCR.OT_RATE_1 - 1) + ot50 * rate * (HCR.OT_RATE_2 - 1)
    }

    st.estimatedGross = +(st.estimatedGross + st.overtimeBonus).toFixed(2)
    st.overtimeBonus  = +st.overtimeBonus.toFixed(2)
    st.nightBonus     = +st.nightBonus.toFixed(2)
    st.sundayBonus    = +st.sundayBonus.toFixed(2)
    st.totalHours     = +st.totalHours.toFixed(2)
    st.normalHours    = +st.normalHours.toFixed(2)
    st.overtime25     = +st.overtime25.toFixed(2)
    st.overtime50     = +st.overtime50.toFixed(2)
    st.nightHours     = +st.nightHours.toFixed(2)
    st.sundayHours    = +st.sundayHours.toFixed(2)
  }

  const allStats    = Array.from(statsMap.values()).sort((a, b) =>
    a.employee.first_name.localeCompare(b.employee.first_name)
  )
  const totalCost   = +allStats.reduce((s, x) => s + x.estimatedGross, 0).toFixed(2)

  const result: MonthlyPlanningData = {
    month:         monthParam,
    monthLabel:    formatMonthLabel(monthParam),
    employeeStats: allStats,
    totalCost,
  }

  return NextResponse.json(result)
}
