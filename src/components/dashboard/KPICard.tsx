import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type KPICardProps = {
  title: string
  /** Valeur affichée en grand (ex: "1 247 €" ou "82") */
  value: string
  /** Libellé optionnel sous la valeur (ex: "couverts") */
  unit?: string
  /** % d'évolution vs la période précédente (positif = hausse) */
  trend: number
  /** Libellé de la comparaison (ex: "vs hier", "vs semaine dernière") */
  trendLabel: string
  /** Couleur de fond/accent de la carte */
  color: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
  icon: LucideIcon
}

// ── Couleurs par variant ──────────────────────────────────────

const colorMap: Record<
  KPICardProps['color'],
  { icon: string; iconBg: string; trendPositive: string; trendNegative: string; trendNeutral: string }
> = {
  brand:   { icon: 'text-blue-600',  iconBg: 'bg-blue-50',   trendPositive: 'text-green-600 bg-green-50',  trendNegative: 'text-red-600 bg-red-50',    trendNeutral: 'text-gray-500 bg-gray-100' },
  success: { icon: 'text-green-600', iconBg: 'bg-green-50',  trendPositive: 'text-green-600 bg-green-50',  trendNegative: 'text-red-600 bg-red-50',    trendNeutral: 'text-gray-500 bg-gray-100' },
  warning: { icon: 'text-amber-600', iconBg: 'bg-amber-50',  trendPositive: 'text-green-600 bg-green-50',  trendNegative: 'text-red-600 bg-red-50',    trendNeutral: 'text-gray-500 bg-gray-100' },
  danger:  { icon: 'text-red-600',   iconBg: 'bg-red-50',    trendPositive: 'text-green-600 bg-green-50',  trendNegative: 'text-red-600 bg-red-50',    trendNeutral: 'text-gray-500 bg-gray-100' },
  neutral: { icon: 'text-gray-600',  iconBg: 'bg-gray-100',  trendPositive: 'text-green-600 bg-green-50',  trendNegative: 'text-red-600 bg-red-50',    trendNeutral: 'text-gray-500 bg-gray-100' },
}

// ── Composant ─────────────────────────────────────────────────

export function KPICard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  color = 'brand',
  icon: Icon,
}: KPICardProps) {
  const c = colorMap[color]

  const isPositive = trend > 0.5
  const isNegative = trend < -0.5
  const trendColors = isPositive ? c.trendPositive : isNegative ? c.trendNegative : c.trendNeutral

  const trendSign   = trend > 0 ? '+' : ''
  const trendStr    = `${trendSign}${trend.toFixed(1).replace('.', ',')} %`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      {/* Header : icône + titre */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.iconBg)}>
          <Icon className={cn('w-5 h-5', c.icon)} strokeWidth={1.8} />
        </div>
      </div>

      {/* Valeur principale */}
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900 leading-none tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-400 mb-0.5 leading-none">{unit}</span>
        )}
      </div>

      {/* Badge de tendance */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
            trendColors
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : isNegative ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {trendStr}
        </span>
        <span className="text-xs text-gray-400">{trendLabel}</span>
      </div>
    </div>
  )
}
