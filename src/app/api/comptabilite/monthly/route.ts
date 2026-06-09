/**
 * GET /api/comptabilite/monthly?month=2026-06
 * Retourne les données financières agrégées pour un mois.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcHours, extractTime } from '@/lib/utils/week-utils'
import { formatMonthLabel } from '@/lib/utils/week-utils'
import type { MonthlyFinancials, WeeklyBreakdown } from '@/types/comptabilite'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? ''

  const monthMatch = month.match(/^(\d{4})-(\d{2})$/)
  if (!monthMatch) {
    return NextResponse.json({ error: 'Format month invalide (YYYY-MM)' }, { status: 422 })
  }

  const year  = parseInt(monthMatch[1])
  const mo    = parseInt(monthMatch[2])
  const from  = `${year}-${String(mo).padStart(2, '0')}-01`
  const last  = new Date(year, mo, 0).getDate()
  const to    = `${year}-${String(mo).padStart(2, '0')}-${last}`

  // Fetch en parallèle
  const [salesRes, invoicesRes, shiftsRes] = await Promise.all([
    supabase
      .from('sales')
      .select('date, total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', from).lte('date', to),
    supabase
      .from('invoices')
      .select('invoice_date, amount, vat_amount')
      .eq('restaurant_id', restaurantId)
      .gte('invoice_date', from).lte('invoice_date', to),
    supabase
      .from('shifts')
      .select('start_time, end_time, employees(hourly_rate)')
      .eq('restaurant_id', restaurantId)
      .gte('start_time', `${from}T00:00:00`)
      .lte('start_time', `${to}T23:59:59`),
  ])

  const sales    = salesRes.data    ?? []
  const invoices = invoicesRes.data ?? []
  const shifts   = shiftsRes.data   ?? []

  // ── Totaux du mois ────────────────────────────────────────

  const monthRevenue  = +sales.reduce((s, r) => s + r.total_revenue, 0).toFixed(2)
  const monthPurchases = +invoices.reduce((s, i) => s + i.amount, 0).toFixed(2)

  const monthLabor = +shifts.reduce((sum, s) => {
    const rate  = (s as unknown as { employees: { hourly_rate: number } }).employees?.hourly_rate ?? 0
    const hours = calcHours(extractTime(s.start_time), extractTime(s.end_time))
    return sum + hours * rate
  }, 0).toFixed(2)

  const monthMargin    = +(monthRevenue - monthPurchases - monthLabor).toFixed(2)
  const marginPct      = monthRevenue > 0 ? +(monthMargin / monthRevenue * 100).toFixed(1) : 0
  const laborPct       = monthRevenue > 0 ? +(monthLabor  / monthRevenue * 100).toFixed(1) : 0
  const purchasesPct   = monthRevenue > 0 ? +(monthPurchases / monthRevenue * 100).toFixed(1) : 0

  // ── Ventilation par semaine ────────────────────────────────

  // Construire les semaines du mois
  const weeklyBreakdown: WeeklyBreakdown[] = []
  const firstDay = new Date(year, mo - 1, 1)
  const lastDay  = new Date(year, mo, 0)

  // Lundi de la première semaine
  let cursor = new Date(firstDay)
  const dayOfWeek = cursor.getDay() || 7
  if (dayOfWeek > 1) cursor.setDate(cursor.getDate() - dayOfWeek + 1)

  let weekIdx = 1
  while (cursor <= lastDay) {
    const weekFrom = new Date(cursor)
    const weekTo   = new Date(cursor)
    weekTo.setDate(weekTo.getDate() + 6)

    const wFrom = weekFrom.toISOString().split('T')[0]
    const wTo   = weekTo.toISOString().split('T')[0]

    const wRevenue   = +sales
      .filter(s => s.date >= wFrom && s.date <= wTo)
      .reduce((s, r) => s + r.total_revenue, 0).toFixed(2)

    const wPurchases = +invoices
      .filter(i => i.invoice_date && i.invoice_date >= wFrom && i.invoice_date <= wTo)
      .reduce((s, i) => s + i.amount, 0).toFixed(2)

    const wLabor = +shifts
      .filter(s => {
        const d = s.start_time.split('T')[0]
        return d >= wFrom && d <= wTo
      })
      .reduce((sum, s) => {
        const rate  = (s as unknown as { employees: { hourly_rate: number } }).employees?.hourly_rate ?? 0
        const hours = calcHours(extractTime(s.start_time), extractTime(s.end_time))
        return sum + hours * rate
      }, 0).toFixed(2)

    const wMargin    = +(wRevenue - wPurchases - parseFloat(wLabor)).toFixed(2)
    const wMarginPct = wRevenue > 0 ? +(wMargin / wRevenue * 100).toFixed(1) : 0

    weeklyBreakdown.push({
      weekLabel:      `S${weekIdx}`,
      fromDate:       wFrom,
      toDate:         wTo,
      revenue:        wRevenue,
      purchases:      wPurchases,
      laborCost:      parseFloat(wLabor),
      grossMargin:    wMargin,
      grossMarginPct: wMarginPct,
    })

    cursor.setDate(cursor.getDate() + 7)
    weekIdx++
    if (weekIdx > 6) break  // Sécurité
  }

  const result: MonthlyFinancials = {
    month,
    monthLabel:     formatMonthLabel(month),
    revenue:        monthRevenue,
    purchases:      monthPurchases,
    laborCost:      monthLabor,
    grossMargin:    monthMargin,
    grossMarginPct: marginPct,
    laborPct,
    purchasesPct,
    weeklyBreakdown,
  }

  return NextResponse.json(result)
}
