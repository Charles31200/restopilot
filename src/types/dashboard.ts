// =============================================================
// PilotResto — Types du tableau de bord
// =============================================================

export type WeeklyDataPoint = {
  /** Label court affiché sur l'axe X : "17 mar", "24 mar"… */
  label: string
  /** Date ISO du lundi de la semaine */
  startDate: string
  /** Chiffre d'affaires de la semaine (€) */
  revenue: number
  /** Nombre de couverts de la semaine */
  covers: number
  /** Food cost en % (ex: 28.5) */
  foodCostPct: number
}

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertType = 'stock' | 'overtime' | 'invoice'

export type DashboardAlert = {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  /** Route vers laquelle le bouton "Voir" pointe */
  href: string
  createdAt: string
}

export type TopDish = {
  rank: number
  name: string
  /** Quantité vendue sur la semaine */
  quantity: number
  /** CA généré par ce plat (€) */
  revenue: number
  /** Food cost en % */
  foodCostPct: number
}

export type DashboardSummary = {
  revenue: {
    day: number
    /** % d'évolution vs hier (positif = hausse) */
    dayTrend: number
    week: number
    /** % d'évolution vs la semaine dernière (même nb de jours) */
    weekTrend: number
    month: number
    /** % d'évolution vs le mois dernier (même nb de jours) */
    monthTrend: number
  }
  covers: {
    day: number
    week: number
    /** % d'évolution vs hier */
    trend: number
  }
  /** Food cost % du jour */
  foodCostPct: number
  /** Masse salariale % du jour */
  laborCostPct: number
  /** Marge brute du jour en € (= CA - food cost) */
  grossMargin: number
  /** Marge brute du jour en % */
  grossMarginPct: number
  /** Données des 8 dernières semaines pour le graphique */
  weeklyData: WeeklyDataPoint[]
  /** Alertes actives */
  alerts: DashboardAlert[]
  /** Top 5 plats de la semaine */
  topDishes: TopDish[]
}
