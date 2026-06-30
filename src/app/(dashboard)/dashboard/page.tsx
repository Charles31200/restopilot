import { Search } from 'lucide-react'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { getDashboardSummary } from '@/lib/utils/dashboard-data'
import { RevenueLineChart } from '@/components/dashboard/RevenueLineChart'
import { RevenueBarChart }  from '@/components/dashboard/RevenueBarChart'
import { DashboardActions } from '@/components/dashboard/DashboardActions'
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
          <h1 className="font-semibold" style={{ fontSize: '24px', color: '#111111', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
          </h1>
        </div>
        <DashboardActions />
      </div>

      {/* ── Tabs + recherche ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-[10px] p-1" style={{ background: '#F5F5F5' }}>
          {['Jour', 'Semaine', 'Mois'].map((tab, i) => (
            <span
              key={tab}
              className="px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium"
              style={
                i === 0
                  ? { background: '#FFFFFF', color: '#111111', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: '#888888' }
              }
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="relative flex-1 max-w-[280px] min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#BBBBBB' }} />
          <input
            type="text"
            placeholder="Search..."
            disabled
            className="w-full rounded-[10px] text-[13px] outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', padding: '9px 12px 9px 36px', color: '#111111' }}
          />
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <KpiCard label="Chiffre d'affaires du jour" value={fmt(summary.revenue.day)} sub={trendText(summary.revenue.dayTrend)} />
        <KpiCard label="Nombre de couverts" value={String(summary.covers.day)} sub={trendText(summary.covers.trend)} />
        <KpiCard label="Ticket moyen" value={fmt(ticketMoyen)} sub={`Food cost ${summary.foodCostPct.toFixed(0)}%`} />
      </div>

      {/* ── Graphe CA + Employés ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
            Revenus des dernières semaines
          </h2>
          <RevenueLineChart data={summary.weeklyData} />
        </div>

        <div className="kpi-card" style={{ padding: '20px' }}>
          <h2 className="text-[15px] font-semibold mb-4" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
            Employés
          </h2>
          {employees.length === 0 ? (
            <p className="text-[13px]" style={{ color: '#888888' }}>Aucun employé actif</p>
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
                    <p className="text-[14px] font-semibold truncate" style={{ color: '#111111' }}>
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: '#888888' }}>
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
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
            Top plats de la semaine
          </h2>
          {topDishes.length === 0 ? (
            <p className="text-[13px]" style={{ color: '#888888' }}>Aucune vente cette semaine</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <th className="text-left text-[12px] font-medium pb-2" style={{ color: '#888888' }}>Plat</th>
                  <th className="text-right text-[12px] font-medium pb-2" style={{ color: '#888888' }}>Qté</th>
                  <th className="text-right text-[12px] font-medium pb-2" style={{ color: '#888888' }}>Food cost</th>
                </tr>
              </thead>
              <tbody>
                {topDishes.map(dish => (
                  <tr key={dish.name} style={{ borderBottom: '1px solid #F7F7F7' }}>
                    <td className="py-2.5 text-[13px]" style={{ color: '#111111' }}>{dish.name}</td>
                    <td className="py-2.5 text-[13px] text-right tabular-nums" style={{ color: '#111111' }}>{dish.quantity}</td>
                    <td
                      className="py-2.5 text-[13px] text-right tabular-nums font-medium"
                      style={{ color: dish.foodCostPct > 32 ? '#DC2626' : '#16A34A' }}
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
          <h2 className="text-[15px] font-semibold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
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

// ── KPI Card (style référence) ──────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={{ marginTop: '6px' }}>{value}</p>
      <p className="text-[12px] mt-2" style={{ color: '#888888' }}>{sub}</p>
    </div>
  )
}
