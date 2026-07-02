import { createClient } from '@/lib/supabase/server'
import type { DashboardSummary, WeeklyDataPoint, DashboardAlert, TopDish } from '@/types/dashboard'

// ── Helpers de date (UTC-strict) ─────────────────────────────
//
// Toutes les dates Supabase (colonne `date`) sont stockées en YYYY-MM-DD
// et interprétées comme UTC minuit par new Date("YYYY-MM-DD"). Il faut
// donc utiliser les méthodes UTC* partout pour éviter que le fuseau
// du serveur (ex: Europe/Paris = UTC+2) ne décale les clés de bucket
// d'un jour via setHours(0,0,0,0) local → toISOString() UTC.

/** Renvoie "YYYY-MM-DD" de la date d passée en UTC. */
function toUTCDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Renvoie le lundi de la semaine de d, à minuit UTC. */
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day  = date.getUTCDay()        // 0 = dimanche, 1 = lundi …
  const diff = (day + 6) % 7          // distance depuis lundi
  date.setUTCDate(date.getUTCDate() - diff)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

/** Formate un objet Date (UTC) en "17 mar", "24 mar"… */
function shortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day:      'numeric',
    month:    'short',
    timeZone: 'UTC',   // force UTC pour coller aux dates Supabase
  })
}

// ── Données mock réalistes ────────────────────────────────────

function buildMockSummary(): DashboardSummary {
  const today  = new Date()
  const monday = getMonday(today)

  const weekMultipliers = [0.93, 1.04, 0.91, 0.99, 0.95, 1.02, 0.97, 1.03]
  const BASE_WEEKLY_REVENUE = 8_400
  const BASE_WEEKLY_COVERS  = 560

  const weeklyData: WeeklyDataPoint[] = weekMultipliers.map((mult, i) => {
    const weeksAgo  = 7 - i
    const weekStart = new Date(monday)
    weekStart.setUTCDate(monday.getUTCDate() - weeksAgo * 7)  // ← UTC

    const daysElapsed = weeksAgo === 0
      ? Math.max(1, ((today.getUTCDay() + 6) % 7) + 1)       // ← UTC
      : 7

    const factor = weeksAgo === 0 ? (daysElapsed / 7) * mult : mult

    return {
      label:        shortDate(weekStart),
      startDate:    toUTCDateStr(weekStart),
      revenue:      Math.round(BASE_WEEKLY_REVENUE  * factor),
      covers:       Math.round(BASE_WEEKLY_COVERS   * factor),
      foodCostPct:  +(27 + (i % 3) * 0.8).toFixed(1),
    }
  })

  const dayRevenue      = 1_247
  const yesterdayRev    = 1_112
  const dayTrend        = +((dayRevenue / yesterdayRev - 1) * 100).toFixed(1)
  const weekRevenue     = weeklyData[7].revenue
  const lastWeekRev     = weeklyData[6].revenue
  const daysElapsedNow  = Math.max(1, ((today.getUTCDay() + 6) % 7) + 1)  // ← UTC
  const lastWeekPartial = Math.round(lastWeekRev * (daysElapsedNow / 7))
  const weekTrend       = +((weekRevenue / lastWeekPartial - 1) * 100).toFixed(1)
  const monthRevenue    = 18_750
  const lastMonthRev    = 16_890
  const monthTrend      = +((monthRevenue / lastMonthRev - 1) * 100).toFixed(1)
  const dayCovers       = 82
  const yesterdayCovers = 74
  const coversTrend     = +((dayCovers / yesterdayCovers - 1) * 100).toFixed(1)
  const foodCostPct     = 27.8
  const dayRevenueMock  = 1_247
  const grossMargin     = Math.round(dayRevenueMock * (1 - foodCostPct / 100))
  const grossMarginPct  = +(100 - foodCostPct).toFixed(1)

  const alerts: DashboardAlert[] = [
    {
      id: 'alert-1',
      type: 'stock',
      severity: 'critical',
      title: 'Stock critique — Farine T55',
      description: 'Seuil minimum atteint (1,2 kg restants). Commande recommandée.',
      href: '/dashboard/stocks',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      id: 'alert-2',
      type: 'overtime',
      severity: 'warning',
      title: 'Heures supplémentaires — M. Dupont',
      description: '3 h sup cette semaine. Seuil conventionnel dépassé (2 h).',
      href: '/dashboard/planning',
      createdAt: new Date(Date.now() - 7_200_000).toISOString(),
    },
    {
      id: 'alert-3',
      type: 'invoice',
      severity: 'info',
      title: 'Facture en attente — Métro',
      description: '847 € échéant dans 2 jours. À valider avant vendredi.',
      href: '/dashboard/comptabilite',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ]

  const topDishes: TopDish[] = [
    { rank: 1, name: 'Entrecôte frites',   quantity: 45, revenue: 1_350, foodCostPct: 35.2 },
    { rank: 2, name: 'Burger du chef',      quantity: 38, revenue:   798, foodCostPct: 27.8 },
    { rank: 3, name: 'Salade César',        quantity: 32, revenue:   448, foodCostPct: 21.5 },
    { rank: 4, name: 'Formule déjeuner',    quantity: 25, revenue:   375, foodCostPct: 32.1 },
    { rank: 5, name: 'Moelleux chocolat',   quantity: 28, revenue:   224, foodCostPct: 17.3 },
  ]

  return {
    revenue: { day: dayRevenue, dayTrend, week: weekRevenue, weekTrend, month: monthRevenue, monthTrend },
    covers:  { day: dayCovers, week: weeklyData[7].covers, trend: coversTrend },
    foodCostPct,
    laborCostPct: 31.5,
    grossMargin,
    grossMarginPct: +grossMarginPct,
    weeklyData,
    alerts,
    topDishes,
  }
}

// ── Requêtes Supabase réelles ─────────────────────────────────

async function fetchRealSummary(restaurantId: string): Promise<DashboardSummary | null> {
  try {
    const supabase = await createClient()

    // Toutes les bornes de date calculées en UTC pour coller aux valeurs Supabase
    const now       = new Date()
    const today     = toUTCDateStr(now)

    const yesterdayD = new Date(now)
    yesterdayD.setUTCDate(yesterdayD.getUTCDate() - 1)
    const yesterday = toUTCDateStr(yesterdayD)

    const monday    = getMonday(now)
    const mondayStr = toUTCDateStr(monday)

    // Vérifier si des données de vente existent
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)

    if (!count || count === 0) return null

    // CA du jour
    const { data: todaySales } = await supabase
      .from('sales')
      .select('total_revenue, covers')
      .eq('restaurant_id', restaurantId)
      .eq('date', today)

    const dayRevenue = todaySales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const dayCovers  = todaySales?.reduce((s, r) => s + r.covers, 0) ?? 0

    // CA hier
    const { data: yesterdaySales } = await supabase
      .from('sales')
      .select('total_revenue, covers')
      .eq('restaurant_id', restaurantId)
      .eq('date', yesterday)

    const yesterdayRevenue = yesterdaySales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const yesterdayCovers  = yesterdaySales?.reduce((s, r) => s + r.covers, 0) ?? 0

    const dayTrend    = yesterdayRevenue > 0 ? +((dayRevenue / yesterdayRevenue - 1) * 100).toFixed(1) : 0
    const coversTrend = yesterdayCovers  > 0 ? +((dayCovers  / yesterdayCovers  - 1) * 100).toFixed(1) : 0

    // CA semaine (lundi → aujourd'hui)
    const { data: weekSales } = await supabase
      .from('sales')
      .select('total_revenue, covers, date')
      .eq('restaurant_id', restaurantId)
      .gte('date', mondayStr)
      .lte('date', today)

    const weekRevenue = weekSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const weekCovers  = weekSales?.reduce((s, r) => s + r.covers, 0) ?? 0

    // CA semaine dernière (même nombre de jours)
    const lastMondayD = new Date(monday)
    lastMondayD.setUTCDate(lastMondayD.getUTCDate() - 7)   // ← UTC
    const daysElapsed = ((now.getUTCDay() + 6) % 7) + 1    // ← UTC
    const lastWeekEndD = new Date(lastMondayD)
    lastWeekEndD.setUTCDate(lastWeekEndD.getUTCDate() + daysElapsed - 1)  // ← UTC

    const { data: lastWeekSales } = await supabase
      .from('sales')
      .select('total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', toUTCDateStr(lastMondayD))
      .lte('date', toUTCDateStr(lastWeekEndD))

    const lastWeekRevenue = lastWeekSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const weekTrend = lastWeekRevenue > 0 ? +((weekRevenue / lastWeekRevenue - 1) * 100).toFixed(1) : 0

    // CA mois en cours
    const firstOfMonthD = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))  // ← UTC
    const { data: monthSales } = await supabase
      .from('sales')
      .select('total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', toUTCDateStr(firstOfMonthD))
      .lte('date', today)

    const monthRevenue = monthSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const monthTrend = 0

    // Données hebdomadaires (8 semaines glissantes)
    const eightWeeksAgoD = new Date(monday)
    eightWeeksAgoD.setUTCDate(eightWeeksAgoD.getUTCDate() - 7 * 7)  // ← UTC

    const { data: historySales } = await supabase
      .from('sales')
      .select('date, total_revenue, covers')
      .eq('restaurant_id', restaurantId)
      .gte('date', toUTCDateStr(eightWeeksAgoD))
      .order('date')

    // Regrouper par semaine — clé = lundi UTC de la semaine
    const weekMap = new Map<string, { revenue: number; covers: number }>()
    for (const sale of historySales ?? []) {
      const saleDate   = new Date(sale.date)  // UTC midnight (string ISO date)
      const saleMon    = getMonday(saleDate)   // lundi UTC
      const key        = toUTCDateStr(saleMon)
      const existing   = weekMap.get(key) ?? { revenue: 0, covers: 0 }
      weekMap.set(key, {
        revenue: existing.revenue + sale.total_revenue,
        covers:  existing.covers  + sale.covers,
      })
    }

    const weeklyData: WeeklyDataPoint[] = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([startDate, data]) => ({
        label:       shortDate(new Date(startDate)),
        startDate,
        revenue:     data.revenue,
        covers:      data.covers,
        foodCostPct: 0,
      }))

    // Produits en dessous du seuil minimum
    const { data: criticalProducts } = await supabase
      .from('products')
      .select('id, name, stock_qty, min_threshold, unit')
      .eq('restaurant_id', restaurantId)

    const alerts: DashboardAlert[] = (criticalProducts ?? [])
      .filter(p => p.stock_qty <= p.min_threshold)
      .slice(0, 5)
      .map(p => ({
        id: `stock-${p.id}`,
        type: 'stock' as const,
        severity: 'critical' as const,
        title: `Stock critique — ${p.name}`,
        description: `${p.stock_qty} ${p.unit} restants (seuil: ${p.min_threshold} ${p.unit})`,
        href: '/dashboard/stocks',
        createdAt: new Date().toISOString(),
      }))

    // Factures en attente (7 prochains jours)
    const dueDateD = new Date(now)
    dueDateD.setUTCDate(dueDateD.getUTCDate() + 7)  // ← UTC

    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select('id, supplier_name, amount, due_date')
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'validated'])
      .lte('due_date', toUTCDateStr(dueDateD))

    for (const inv of (pendingInvoices ?? []).slice(0, 3)) {
      const daysLeft = inv.due_date
        ? Math.ceil((new Date(inv.due_date).getTime() - now.getTime()) / 86_400_000)
        : null

      alerts.push({
        id: `invoice-${inv.id}`,
        type: 'invoice',
        severity: 'info',
        title: `Facture en attente — ${inv.supplier_name ?? 'Fournisseur'}`,
        description: `${inv.amount} € ${daysLeft !== null ? `— échéant dans ${daysLeft}j` : ''}`,
        href: '/dashboard/comptabilite',
        createdAt: new Date().toISOString(),
      })
    }

    // Top plats (semaine en cours)
    const { data: topDishesData } = await supabase
      .from('sale_items')
      .select('dish_name, quantity_sold, unit_price, sale:sales!inner(date, restaurant_id)')
      .eq('sale.restaurant_id', restaurantId)
      .gte('sale.date', mondayStr)

    const dishMap = new Map<string, { quantity: number; revenue: number }>()
    for (const item of topDishesData ?? []) {
      const existing = dishMap.get(item.dish_name) ?? { quantity: 0, revenue: 0 }
      dishMap.set(item.dish_name, {
        quantity: existing.quantity + item.quantity_sold,
        revenue:  existing.revenue  + item.unit_price * item.quantity_sold,
      })
    }

    const topDishes: TopDish[] = Array.from(dishMap.entries())
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([name, data], i) => ({
        rank: i + 1,
        name,
        quantity:    data.quantity,
        revenue:     Math.round(data.revenue),
        foodCostPct: 0,
      }))

    return {
      revenue:        { day: dayRevenue, dayTrend, week: weekRevenue, weekTrend, month: monthRevenue, monthTrend },
      covers:         { day: dayCovers, week: weekCovers, trend: coversTrend },
      foodCostPct:    0,
      laborCostPct:   0,
      grossMargin:    Math.round(dayRevenue * 0.72),
      grossMarginPct: 72,
      weeklyData:     weeklyData.length > 0 ? weeklyData : buildMockSummary().weeklyData,
      alerts,
      topDishes:      topDishes.length > 0 ? topDishes : buildMockSummary().topDishes,
    }
  } catch {
    return null
  }
}

// ── Point d'entrée public ─────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return buildMockSummary()

    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.restaurant_id) return buildMockSummary()

    const real = await fetchRealSummary(profile.restaurant_id)
    return real ?? buildMockSummary()
  } catch {
    return buildMockSummary()
  }
}
