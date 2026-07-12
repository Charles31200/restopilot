import { Search, Euro, Users, Receipt, TrendingUp } from 'lucide-react'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { getDashboardSummary } from '@/lib/utils/dashboard-data'
import { RevenueLineChart } from '@/components/dashboard/RevenueLineChart'
import { RevenueBarChart }  from '@/components/dashboard/RevenueBarChart'
import { DashboardActions } from '@/components/dashboard/DashboardActions'
import { CashEntryCard }    from '@/components/dashboard/CashEntryCard'
import type { Employee, EmployeeRole } from '@/types'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function trendText(trend: number) {
  const sign = trend >= 0 ? '+' : ''
  return `${sign}${trend.toFixed(0)}% vs hier`
}

const ROLE_LABELS: Record<EmployeeRole, string> = {
  cuisinier: 'Cuisinier',
  serveur:   'Serveur',
  barman:    'Barman',
  plongeur:  'Plongeur',
  manager:   'Manager',
  autre:     'Employé',
}

// ── Page ──────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [profile, restaurant, summary] = await Promise.all([
    getCurrentProfile(),
    getCurrentRestaurant(),
    getDashboardSummary(),
  ])

  let employees: Employee[] = []
  if (restaurant?.id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('first_name')
      .limit(5)
    employees = (data ?? []) as Employee[]
  }

  const firstName    = profile?.first_name ?? ''
  const ticketMoyen  = summary.covers.day > 0 ? summary.revenue.day / summary.covers.day : 0
  const topDishes    = summary.topDishes.slice(0, 7)

  return (
    <>
      {/* ── Header de page ───────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold" style={{ fontSize: '24px', color: '#FFFFFF', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
          </h1>
        </div>
        <DashboardActions />
      </div>

      {/* ── Tabs + recherche ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-[10px] p-1" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['Jour', 'Semaine', 'Mois'].map((tab, i) => (
            <span
              key={tab}
              className="px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium"
              style={
                i === 0
                  ? { background: '#7798AB', color: '#FFFFFF' }
                  : { color: 'rgba(255,255,255,0.45)' }
              }
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="relative flex-1 max-w-[280px] min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="Search..."
            disabled
            className="w-full rounded-[10px] text-[13px] outline-none"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 12px 9px 36px', color: '#FFFFFF' }}
          />
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <KpiCard icon={Euro}        iconColor="#7798AB" label="Chiffre d'affaires du jour" value={fmt(summary.revenue.day)}  trend={summary.revenue.dayTrend} />
        <KpiCard icon={Users}       iconColor="#4ADE80" label="Couverts du jour"            value={String(summary.covers.day)} trend={summary.covers.trend} />
        <KpiCard icon={Receipt}     iconColor="#FBBF24" label="Ticket moyen"                value={fmt(ticketMoyen)} sub={`Food cost ${summary.foodCostPct.toFixed(0)}%`} />
        <KpiCard icon={TrendingUp}  iconColor="#7798AB" label="Ventes ce mois"              value={fmt(summary.revenue.month)} trend={summary.revenue.monthTrend} />
      </div>

      {/* ── Espèces déclarées (optionnel) ─────────────────── */}
      <div className="mb-5">
        <CashEntryCard />
      </div>

      {/* ── Graphe CA + Employés ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            Revenus des dernières semaines
          </h2>
          <RevenueLineChart data={summary.weeklyData} />
        </div>

        <div className="kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            Employés
          </h2>
          {employees.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucun employé actif</p>
          ) : (
            <div className="space-y-4">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[12px] flex-shrink-0 text-white"
                    style={{ background: emp.color || '#7798AB' }}
                  >
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: '#FFFFFF' }}>
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {ROLE_LABELS[emp.role]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ventes récentes + Revenus par mois ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            Top plats de la semaine
          </h2>
          {topDishes.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune vente cette semaine</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left text-[12px] font-medium pb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Plat</th>
                  <th className="text-right text-[12px] font-medium pb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Qté</th>
                  <th className="text-right text-[12px] font-medium pb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Food cost</th>
                </tr>
              </thead>
              <tbody>
                {topDishes.map(dish => (
                  <tr key={dish.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-2.5 text-[13px]" style={{ color: '#FFFFFF' }}>{dish.name}</td>
                    <td className="py-2.5 text-[13px] text-right tabular-nums" style={{ color: '#FFFFFF' }}>{dish.quantity}</td>
                    <td
                      className="py-2.5 text-[13px] text-right tabular-nums font-medium"
                      style={{ color: dish.foodCostPct > 32 ? '#F87171' : '#4ADE80' }}
                    >
                      {dish.foodCostPct.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            Revenus par semaine
          </h2>
          <RevenueBarChart data={summary.weeklyData} />
        </div>
      </div>

      {/* ── FAB mobile + modal (rendu côté client) ────────── */}
      <DashboardActions />
    </>
  )
}

// ── KPI Card (icône en cercle + variation) ───────────────────

type KpiCardProps = {
  icon:      React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  iconColor: string
  label:     string
  value:     string
  /** Variation en % — coloré vert (positif) / rouge (négatif). Prioritaire sur `sub`. */
  trend?:    number
  /** Texte libre affiché à la place de la variation (ex: food cost). */
  sub?:      string
}

function KpiCard({ icon: Icon, iconColor, label, value, trend, sub }: KpiCardProps) {
  const trendPositive = (trend ?? 0) >= 0
  return (
    <div className="kpi-card flex items-start justify-between gap-3">
      <div>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value" style={{ marginTop: '6px' }}>{value}</p>
        {trend !== undefined ? (
          <p
            className="text-[12px] mt-2 font-medium"
            style={{ color: trendPositive ? '#4ADE80' : '#F87171' }}
          >
            {trendPositive ? '+' : ''}{trend.toFixed(0)}% vs hier
          </p>
        ) : (
          <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}26` }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>
    </div>
  )
}
