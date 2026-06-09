import { createClient } from '@/lib/supabase/server'
import type { DashboardSummary, WeeklyDataPoint, DashboardAlert, TopDish } from '@/types/dashboard'

// ── Helpers de formatage (serveur) ───────────────────────────

/** Formate une date ISO en "17 mar", "24 mar"… */
function shortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Retourne le lundi de la semaine d'une date donnée */
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day + 6) % 7 // distance depuis lundi
  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

// ── Données mock réalistes ────────────────────────────────────
// Restaurant : 40 couverts/service · 2 services · CA moyen 1 200€/j
// Food cost : 28 % · Masse salariale : 32 %

function buildMockSummary(): DashboardSummary {
  const today = new Date()
  const monday = getMonday(today)

  // ── 8 semaines de données hebdomadaires ─────────────────

  // Multiplicateurs hebdo fixes (déterministe — pas de Math.random)
  const weekMultipliers = [0.93, 1.04, 0.91, 0.99, 0.95, 1.02, 0.97, 1.03]
  const BASE_WEEKLY_REVENUE = 8_400   // 1 200€ × 7 jours
  const BASE_WEEKLY_COVERS  = 560     // 80 couverts × 7 jours

  const weeklyData: WeeklyDataPoint[] = weekMultipliers.map((mult, i) => {
    const weeksAgo = 7 - i
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() - weeksAgo * 7)

    // La semaine en cours est partielle — on calcule les jours écoulés
    const daysElapsed = weeksAgo === 0
      ? Math.max(1, ((today.getDay() + 6) % 7) + 1)
      : 7

    const factor = weeksAgo === 0 ? (daysElapsed / 7) * mult : mult

    return {
      label:        shortDate(weekStart),
      startDate:    weekStart.toISOString().split('T')[0],
      revenue:      Math.round(BASE_WEEKLY_REVENUE  * factor),
      covers:       Math.round(BASE_WEEKLY_COVERS   * factor),
      foodCostPct:  +(27 + (i % 3) * 0.8).toFixed(1),  // 27–29,4 %
    }
  })

  // ── KPIs du jour ─────────────────────────────────────────

  const dayRevenue    = 1_247
  const yesterdayRev  = 1_112
  const dayTrend      = +((dayRevenue / yesterdayRev - 1) * 100).toFixed(1)  // +12.1 %

  const weekRevenue   = weeklyData[7].revenue
  const lastWeekRev   = weeklyData[6].revenue
  // Comparaison sur le même nombre de jours élapsés
  const daysElapsedNow = Math.max(1, ((today.getDay() + 6) % 7) + 1)
  const lastWeekPartial = Math.round(lastWeekRev * (daysElapsedNow / 7))
  const weekTrend     = +((weekRevenue / lastWeekPartial - 1) * 100).toFixed(1)

  const monthRevenue  = 18_750
  const lastMonthRev  = 16_890
  const monthTrend    = +((monthRevenue / lastMonthRev - 1) * 100).toFixed(1)  // +11 %

  const dayCovers     = 82
  const yesterdayCovers = 74
  const coversTrend   = +((dayCovers / yesterdayCovers - 1) * 100).toFixed(1)

  const foodCostPct   = 27.8
  const laborCostPct  = 31.5
  const grossMargin   = Math.round(dayRevenue * (1 - foodCostPct / 100))
  const grossMarginPct = +(100 - foodCostPct).toFixed(1)

  // ── Alertes ───────────────────────────────────────────────

  const alerts: DashboardAlert[] = [
    {
      id: 'alert-1',
      type: 'stock',
      severity: 'critical',
      title: 'Stock critique — Farine T55',
      description: 'Seuil minimum atteint (1,2 kg restants). Commande recommandée.',
      href: '/dashboard/stocks',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),   // Il y a 1h
    },
    {
      id: 'alert-2',
      type: 'overtime',
      severity: 'warning',
      title: 'Heures supplémentaires — M. Dupont',
      description: '3 h sup cette semaine. Seuil conventionnel dépassé (2 h).',
      href: '/dashboard/planning',
      createdAt: new Date(Date.now() - 7_200_000).toISOString(),   // Il y a 2h
    },
    {
      id: 'alert-3',
      type: 'invoice',
      severity: 'info',
      title: 'Facture en attente — Métro',
      description: '847 € échéant dans 2 jours. À valider avant vendredi.',
      href: '/dashboard/comptabilite',
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),  // Hier
    },
  ]

  // ── Top 5 plats de la semaine ─────────────────────────────

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
    laborCostPct,
    grossMargin,
    grossMarginPct,
    weeklyData,
    alerts,
    topDishes,
  }
}

// ── Requêtes Supabase réelles ─────────────────────────────────

async function fetchRealSummary(restaurantId: string): Promise<DashboardSummary | null> {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

    // Vérifier si des données de vente existent
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)

    if (!count || count === 0) return null   // Aucune donnée → fallback mock

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

    const dayTrend     = yesterdayRevenue > 0 ? +((dayRevenue / yesterdayRevenue - 1) * 100).toFixed(1) : 0
    const coversTrend  = yesterdayCovers  > 0 ? +((dayCovers  / yesterdayCovers  - 1) * 100).toFixed(1) : 0

    // CA semaine (lundi → aujourd'hui)
    const monday = getMonday(new Date())
    const mondayStr = monday.toISOString().split('T')[0]

    const { data: weekSales } = await supabase
      .from('sales')
      .select('total_revenue, covers, date')
      .eq('restaurant_id', restaurantId)
      .gte('date', mondayStr)
      .lte('date', today)

    const weekRevenue = weekSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const weekCovers  = weekSales?.reduce((s, r) => s + r.covers, 0) ?? 0

    // CA semaine dernière (même nombre de jours)
    const lastMonday = new Date(monday)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const daysElapsed = ((new Date().getDay() + 6) % 7) + 1
    const lastWeekEnd = new Date(lastMonday)
    lastWeekEnd.setDate(lastWeekEnd.getDate() + daysElapsed - 1)

    const { data: lastWeekSales } = await supabase
      .from('sales')
      .select('total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', lastMonday.toISOString().split('T')[0])
      .lte('date', lastWeekEnd.toISOString().split('T')[0])

    const lastWeekRevenue = lastWeekSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    const weekTrend = lastWeekRevenue > 0 ? +((weekRevenue / lastWeekRevenue - 1) * 100).toFixed(1) : 0

    // CA mois en cours
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const { data: monthSales } = await supabase
      .from('sales')
      .select('total_revenue')
      .eq('restaurant_id', restaurantId)
      .gte('date', firstOfMonth.toISOString().split('T')[0])
      .lte('date', today)

    const monthRevenue = monthSales?.reduce((s, r) => s + r.total_revenue, 0) ?? 0
    // Tendance mois : comparaison sur même nb de jours mois précédent
    const monthTrend = 0 // Simplifié pour l'implémentation initiale

    // Données hebdomadaires (8 semaines)
    const eightWeeksAgo = new Date(monday)
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7)

    const { data: historySales } = await supabase
      .from('sales')
      .select('date, total_revenue, covers')
      .eq('restaurant_id', restaurantId)
      .gte('date', eightWeeksAgo.toISOString().split('T')[0])
      .order('date')

    // Regrouper par semaine
    const weekMap = new Map<string, { revenue: number; covers: number }>()
    for (const sale of historySales ?? []) {
      const saleDate = new Date(sale.date)
      const saleMonday = getMonday(saleDate).toISOString().split('T')[0]
      const existing = weekMap.get(saleMonday) ?? { revenue: 0, covers: 0 }
      weekMap.set(saleMonday, {
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
        foodCostPct: 0, // TODO: calculer depuis stock_movements
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

    // Factures en attente
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select('id, supplier_name, amount, due_date')
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'validated'])
      .lte('due_date', dueDate.toISOString().split('T')[0])

    for (const inv of (pendingInvoices ?? []).slice(0, 3)) {
      const daysLeft = inv.due_date
        ? Math.ceil((new Date(inv.due_date).getTime() - Date.now()) / 86_400_000)
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
        foodCostPct: 0, // TODO: calculer depuis recipe_ingredients + buy_price
      }))

    return {
      revenue:       { day: dayRevenue, dayTrend, week: weekRevenue, weekTrend, month: monthRevenue, monthTrend },
      covers:        { day: dayCovers, week: weekCovers, trend: coversTrend },
      foodCostPct:   0,   // TODO: calculer depuis stock_movements
      laborCostPct:  0,   // TODO: calculer depuis shifts
      grossMargin:   Math.round(dayRevenue * 0.72),
      grossMarginPct: 72,
      weeklyData:    weeklyData.length > 0 ? weeklyData : buildMockSummary().weeklyData,
      alerts,
      topDishes:     topDishes.length > 0 ? topDishes : buildMockSummary().topDishes,
    }
  } catch {
    return null
  }
}

// ── Point d'entrée public ─────────────────────────────────────

/**
 * Récupère le résumé du tableau de bord.
 * Si aucune donnée réelle n'existe (restaurant vide ou non configuré),
 * retourne des données mock réalistes pour la démo.
 */
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
