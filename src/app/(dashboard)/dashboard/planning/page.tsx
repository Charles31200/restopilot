import type { Metadata } from 'next'
import { createClient }       from '@/lib/supabase/server'
import { getCurrentUser }     from '@/lib/supabase/auth'
import { getCurrentWeek, getWeekDays, toISODate, extractTime, calcHours } from '@/lib/utils/week-utils'
import { calculateShiftCost, calcNightHours, HCR }                        from '@/lib/utils/hcr-rules'
import { PlanningClient }     from '@/components/planning/PlanningClient'
import type { WeekData, ShiftWithEmployee, EmployeeWeeklyStats } from '@/types/planning'
import type { Employee } from '@/types'

export const metadata: Metadata = {
  title: 'Planning — PilotResto',
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week: weekParam } = await searchParams

  // Valider et normaliser le paramètre de semaine
  const week = weekParam?.match(/^\d{4}-W\d{2}$/)
    ? weekParam
    : getCurrentWeek()

  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  if (!profile?.restaurant_id) {
    return (
      <div className="space-y-6 max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Planning</h1>
        <PlanningClient initialData={null} initialWeek={week} />
      </div>
    )
  }

  const restaurantId = profile.restaurant_id
  const weekDays     = getWeekDays(week)
  const fromDate     = toISODate(weekDays[0])
  const toDate       = toISODate(weekDays[6])

  // Fetch en parallèle
  const [shiftsRes, employeesRes, salesRes] = await Promise.all([
    supabase
      .from('shifts')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('start_time', `${fromDate}T00:00:00`)
      .lte('start_time', `${toDate}T23:59:59`)
      .order('start_time'),
    supabase
      .from('employees')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('first_name'),
    supabase
      .from('sales')
      .select('total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', fromDate)
      .lte('date', toDate),
  ])

  const employees = (employeesRes.data ?? []) as Employee[]
  const empMap    = new Map(employees.map(e => [e.id, e]))

  const shifts: ShiftWithEmployee[] = (shiftsRes.data ?? []).map(s => ({
    ...s,
    employee: empMap.get(s.employee_id) ?? {
      id: s.employee_id, first_name: '?', last_name: '', role: 'autre',
      color: '#94A3B8', hourly_rate: 0, contract_type: 'CDI',
    },
  }))

  // Calcul stats hebdo
  const statsMap = new Map<string, EmployeeWeeklyStats>(
    employees.map(e => [e.id, {
      employee: e, plannedHours: 0, normalHours: 0,
      overtime25: 0, overtime50: 0, nightHours: 0, sundayHours: 0, weeklyCost: 0,
    }])
  )

  for (const shift of shifts) {
    const st = statsMap.get(shift.employee_id)
    if (!st) continue
    const startT = extractTime(shift.start_time)
    const endT   = extractTime(shift.end_time)
    const hours  = calcHours(startT, endT)
    const night  = calcNightHours(startT, endT)
    const isSun  = new Date(shift.start_time).getDay() === 0

    st.plannedHours += hours
    st.nightHours   += night
    if (isSun) st.sundayHours += hours
    const cost = calculateShiftCost(shift.employee.hourly_rate, startT, endT, new Date(shift.start_time))
    st.weeklyCost += cost.totalCost
  }

  for (const st of statsMap.values()) {
    const h = st.plannedHours
    st.normalHours = Math.min(h, HCR.WEEKLY_NORMAL_HOURS)
    st.overtime25  = Math.max(0, Math.min(h - HCR.WEEKLY_NORMAL_HOURS, HCR.OT_THRESHOLD_1 - HCR.WEEKLY_NORMAL_HOURS))
    st.overtime50  = Math.max(0, h - HCR.OT_THRESHOLD_1)
    const empRate  = st.employee.hourly_rate
    const otSup    = st.overtime25 * empRate * (HCR.OT_RATE_1 - 1) + st.overtime50 * empRate * (HCR.OT_RATE_2 - 1)
    st.weeklyCost  = +(st.weeklyCost + otSup).toFixed(2)
  }

  const weeklyStats = Array.from(statsMap.values())
  const totalCost   = +weeklyStats.reduce((s, x) => s + x.weeklyCost, 0).toFixed(2)
  const weekRevenue = (salesRes.data ?? []).reduce((s, r) => s + r.total_revenue, 0) || null

  const weekData: WeekData = {
    week,
    weekDates:  weekDays.map(toISODate),
    shifts,
    employees,
    weeklyStats,
    totalCost,
    weekRevenue,
  }

  return (
    <>
      {/* ── Header de page ──────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            Planning du personnel
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            {employees.length} employé{employees.length > 1 ? 's' : ''} actif{employees.length > 1 ? 's' : ''}
            {shifts.length > 0 && ` · ${shifts.length} créneau${shifts.length > 1 ? 'x' : ''} cette semaine`}
          </p>
        </div>
      </div>

      <PlanningClient initialData={weekData} initialWeek={week} />
    </>
  )
}
