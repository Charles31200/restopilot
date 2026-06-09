import {
  Euro, Users, TrendingUp, AlertTriangle,
  Package, Clock, FileText,
} from 'lucide-react'
import { getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { getDashboardSummary } from '@/lib/utils/dashboard-data'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { KPICard }      from '@/components/ui/KPICard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge }        from '@/components/ui/Badge'
import { ListItem }     from '@/components/ui/ListItem'
import { WeeklyBarChart }    from '@/components/dashboard/WeeklyBarChart'
import { DashboardActions } from '@/components/dashboard/DashboardActions'
import type { AlertType, AlertSeverity } from '@/types/dashboard'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ── Config alertes ────────────────────────────────────────────

const ALERT_ICONS: Record<AlertType, React.ReactNode> = {
  stock:    <Package    size={20} strokeWidth={1.75} style={{ color: 'var(--rp-danger)'  }} />,
  overtime: <Clock      size={20} strokeWidth={1.75} style={{ color: 'var(--rp-warning)' }} />,
  invoice:  <FileText   size={20} strokeWidth={1.75} style={{ color: 'var(--rp-blue)'   }} />,
}

const ALERT_SEVERITY_BADGE: Record<AlertSeverity, React.ReactNode> = {
  critical: <Badge variant="danger"  size="sm">Critique</Badge>,
  warning:  <Badge variant="warning" size="sm">Attention</Badge>,
  info:     <Badge variant="blue"    size="sm">Info</Badge>,
}

// ── Icône météo financière ────────────────────────────────────

function weatherEmoji(trend: number) {
  if (trend >= 10)  return '🌞'
  if (trend >= 2)   return '☀️'
  if (trend >= -2)  return '⛅'
  if (trend >= -10) return '🌦️'
  return '🌧️'
}

// ── Page ──────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [profile, restaurant, summary] = await Promise.all([
    getCurrentProfile(),
    getCurrentRestaurant(),
    getDashboardSummary(),
  ])

  const firstName      = profile?.first_name ?? ''
  const restaurantName = restaurant?.name ?? 'Mon restaurant'
  const alerts         = summary.alerts.slice(0, 3)
  const topDishes      = summary.topDishes.slice(0, 5)
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      {/* ── Header mobile — fond navy (home) ──────────────── */}
      <MobileHeader
        title={restaurantName}
        variant="dark"
        badgeCount={summary.alerts.filter(a => a.severity === 'critical').length}
      />

      {/* ── Header desktop (caché sur mobile) ────────────── */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
            {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--rp-navy-muted)' }}>{today}</p>
        </div>
        <DashboardActions />
      </div>

      {/* ── Header mobile visible (dessus du spacer) ─────── */}
      <div className="lg:hidden mb-4">
        {/* Bloc de salutation sous le MobileHeader navy */}
        <div
          className="px-4 pt-4 pb-5 rounded-b-[20px] -mt-2"
          style={{ background: 'var(--rp-navy)' }}
        >
          <p
            className="text-[20px] font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
          </p>
          <p
            className="text-[13px] mt-0.5 capitalize"
            style={{ color: 'var(--rp-amber-light)', fontFamily: 'var(--font-body)' }}
          >
            {restaurantName} · {today}
          </p>
        </div>
      </div>

      {/* ═══ SECTION 1 — KPIs 2×2 ══════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          label="CA aujourd'hui"
          value={fmt(summary.revenue.day)}
          trend={summary.revenue.dayTrend}
          trendLabel="vs hier"
          icon={<Euro size={20} strokeWidth={1.75} />}
          color="amber"
        />
        <KPICard
          label="CA semaine"
          value={fmt(summary.revenue.week)}
          trend={summary.revenue.weekTrend}
          trendLabel="vs s. dernière"
          icon={<TrendingUp size={20} strokeWidth={1.75} />}
          color="success"
        />
        <KPICard
          label="Couverts / jour"
          value={String(summary.covers.day)}
          trend={summary.covers.trend}
          trendLabel="vs hier"
          icon={<Users size={20} strokeWidth={1.75} />}
          color="blue"
        />
        <KPICard
          label="Marge brute"
          value={fmt(summary.grossMargin)}
          trend={summary.grossMarginPct > 20 ? summary.grossMarginPct - 20 : summary.grossMarginPct - 20}
          trendLabel="du CA"
          icon={<TrendingUp size={20} strokeWidth={1.75} />}
          color={summary.grossMarginPct > 20 ? 'success' : 'danger'}
        />
      </div>

      {/* ═══ SECTION 2 — Alertes ════════════════════════════ */}
      {alerts.length > 0 && (
        <>
          <SectionHeader
            title="Alertes actives"
            onSeeAll={summary.alerts.length > 3 ? '/dashboard/comptabilite' : undefined}
          />
          <div
            className="rounded-[16px] overflow-hidden"
            style={{ background: 'var(--rp-white)', border: '1px solid var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}
          >
            {alerts.map((alert, i) => (
              <ListItem
                key={alert.id}
                leading={
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--rp-lavender-light)' }}>
                    {ALERT_ICONS[alert.type]}
                  </div>
                }
                title={alert.title}
                subtitle={alert.description}
                trailing={ALERT_SEVERITY_BADGE[alert.severity]}
                chevron
                onClick={undefined}
                noSeparator={i === alerts.length - 1}
              />
            ))}
            {summary.alerts.length > 3 && (
              <a
                href="/dashboard/comptabilite"
                className="flex items-center justify-center h-11 text-[13px] font-semibold"
                style={{ color: 'var(--rp-amber)', borderTop: '1px solid var(--rp-lavender-light)', fontFamily: 'var(--font-body)' }}
              >
                Voir toutes les alertes ({summary.alerts.length})
              </a>
            )}
          </div>
        </>
      )}

      {/* ═══ SECTION 3 — Graphe semaine ═════════════════════ */}
      <SectionHeader title="Cette semaine" />
      <div
        className="rounded-[16px] overflow-hidden"
        style={{ background: 'var(--rp-white)', border: '1px solid var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)', padding: '16px' }}
      >
        <WeeklyBarChart data={summary.weeklyData} />
      </div>

      {/* ═══ SECTION 4 — Top plats ══════════════════════════ */}
      {topDishes.length > 0 && (
        <>
          <SectionHeader title="Top plats" onSeeAll="/dashboard/comptabilite" />
          <div
            className="rounded-[16px] overflow-hidden mb-4"
            style={{ background: 'var(--rp-white)', border: '1px solid var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}
          >
            {topDishes.map((dish, i) => (
              <ListItem
                key={dish.name}
                leading={
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold"
                    style={{ background: 'var(--rp-amber-light)', color: 'var(--rp-amber-dark)', fontFamily: 'var(--font-display)' }}
                  >
                    #{dish.rank}
                  </div>
                }
                title={dish.name}
                subtitle={fmt(dish.revenue)}
                trailing={
                  <div className="text-right">
                    <p className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-body)' }}>
                      ×{dish.quantity}
                    </p>
                    {dish.foodCostPct > 0 && (
                      <Badge variant={dish.foodCostPct > 35 ? 'danger' : 'success'} size="sm">
                        {dish.foodCostPct.toFixed(0)}% FC
                      </Badge>
                    )}
                  </div>
                }
                noSeparator={i === topDishes.length - 1}
              />
            ))}
          </div>
        </>
      )}

      {/* ── FAB mobile + modal (rendu côté client) ────────── */}
      <DashboardActions />
    </>
  )
}
