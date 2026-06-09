import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type KPIColorScheme = 'amber' | 'blue' | 'success' | 'danger' | 'navy'

export type KPICardProps = {
  label:      string
  value:      string
  trend?:     number    // % (positif = hausse, négatif = baisse)
  trendLabel?: string   // ex: "vs hier"
  icon:       React.ReactNode
  color?:     KPIColorScheme
  className?: string
  onClick?:   () => void
}

// ── Config couleurs icône ─────────────────────────────────────

const ICON_COLORS: Record<KPIColorScheme, string> = {
  amber:   'var(--rp-amber)',
  blue:    'var(--rp-blue)',
  success: 'var(--rp-success)',
  danger:  'var(--rp-danger)',
  navy:    'var(--rp-navy-muted)',
}

// ── Composant ─────────────────────────────────────────────────

export function KPICard({ label, value, trend, trendLabel, icon, color = 'navy', className, onClick }: KPICardProps) {
  // Déterminer le type de tendance
  const trendType = trend === undefined || trend === 0 ? 'neutral'
    : trend > 0 ? 'up' : 'down'

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick() } : undefined}
      className={cn(
        'rounded-[16px] p-4 min-h-[100px] flex flex-col',
        onClick && 'cursor-pointer active:scale-[0.97] transition-transform duration-100',
        className
      )}
      style={{
        background: 'var(--rp-white)',
        border:     '1px solid var(--rp-lavender-light)',
        boxShadow:  'var(--rp-shadow-card)',
      }}
    >
      {/* Ligne du haut : icône + badge tendance */}
      <div className="flex items-center justify-between mb-auto">
        <span style={{ color: ICON_COLORS[color] }}>{icon}</span>

        {trend !== undefined && (
          <TrendBadge type={trendType} value={trend} label={trendLabel} />
        )}
      </div>

      {/* Valeur principale */}
      <p
        className="text-[26px] font-bold leading-[1.1] mt-2 tabular-nums"
        style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>

      {/* Label */}
      <p
        className="text-[12px] mt-1 leading-tight"
        style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </p>
    </div>
  )
}

// ── Badge tendance ────────────────────────────────────────────

function TrendBadge({ type, value, label }: {
  type:   'up' | 'down' | 'neutral'
  value:  number
  label?: string
}) {
  const configs = {
    up: {
      bg:    'var(--rp-success-bg)',
      color: 'var(--rp-success)',
      icon:  <TrendingUp size={11} strokeWidth={2.5} />,
      text:  `↑ +${Math.abs(value).toFixed(1)}%`,
    },
    down: {
      bg:    'var(--rp-danger-bg)',
      color: 'var(--rp-danger)',
      icon:  <TrendingDown size={11} strokeWidth={2.5} />,
      text:  `↓ −${Math.abs(value).toFixed(1)}%`,
    },
    neutral: {
      bg:    'var(--rp-lavender-light)',
      color: 'var(--rp-navy-muted)',
      icon:  <Minus size={11} strokeWidth={2.5} />,
      text:  '0%',
    },
  }

  const cfg = configs[type]

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-body)' }}
      title={label}
    >
      {cfg.icon}
      {cfg.text}
    </span>
  )
}
