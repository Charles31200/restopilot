import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type StatConfig = {
  label: string
  value: number
  /** Valeur affichée (ex: "27,8 %" ou "901 €") */
  displayValue: string
  /** Seuil d'alerte (au-delà = orange/rouge selon `alertMode`) */
  threshold: number
  /** max de la jauge */
  max: number
  /** 'lower-is-better' : vert en dessous du seuil, rouge au-dessus */
  alertMode: 'lower-is-better' | 'higher-is-better'
  /** Description au survol / sous le label */
  hint: string
}

type QuickStatsProps = {
  foodCostPct: number
  laborCostPct: number
  grossMargin: number
}

// ── Helpers ───────────────────────────────────────────────────

function getBarColor(
  value: number,
  threshold: number,
  mode: 'lower-is-better' | 'higher-is-better'
): { bar: string; text: string; bg: string } {
  const exceeds = mode === 'lower-is-better' ? value > threshold : value < threshold

  if (!exceeds) {
    return { bar: '#22C55E', text: 'text-green-700', bg: 'bg-green-50' }
  }
  // Dépassement léger (< 20 % au-delà du seuil) → orange
  const overshoot = Math.abs(value - threshold) / threshold
  if (overshoot < 0.2) {
    return { bar: '#F59E0B', text: 'text-amber-700', bg: 'bg-amber-50' }
  }
  return { bar: '#EF4444', text: 'text-red-700', bg: 'bg-red-50' }
}

// ── Composant jauge horizontale ───────────────────────────────

function GaugeBar({
  value,
  max,
  threshold,
  barColor,
}: {
  value: number
  max: number
  threshold: number
  barColor: string
}) {
  const fillWidth  = `${Math.min((value     / max) * 100, 100)}%`
  const thresholdX = `${Math.min((threshold / max) * 100, 100)}%`

  return (
    <div className="relative h-2 bg-gray-100 rounded-full overflow-visible mt-2">
      {/* Barre de remplissage */}
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: fillWidth, backgroundColor: barColor }}
      />
      {/* Marqueur seuil */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-400 rounded-full z-10"
        style={{ left: thresholdX }}
        title={`Seuil : ${threshold}`}
      />
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────

export function QuickStats({ foodCostPct, laborCostPct, grossMargin }: QuickStatsProps) {
  const stats: StatConfig[] = [
    {
      label:        'Food cost',
      value:        foodCostPct,
      displayValue: `${foodCostPct.toFixed(1).replace('.', ',')} %`,
      threshold:    32,        // seuil d'alerte : 32 %
      max:          55,
      alertMode:    'lower-is-better',
      hint:         'Objectif ≤ 32 %',
    },
    {
      label:        'Masse salariale',
      value:        laborCostPct,
      displayValue: `${laborCostPct.toFixed(1).replace('.', ',')} %`,
      threshold:    35,        // seuil d'alerte : 35 %
      max:          60,
      alertMode:    'lower-is-better',
      hint:         'Objectif ≤ 35 %',
    },
    {
      label:        'Marge brute',
      value:        grossMargin,
      displayValue: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(grossMargin),
      threshold:    800,       // seuil cible : 800 €/jour
      max:          1600,
      alertMode:    'higher-is-better',
      hint:         'Objectif ≥ 800 €/jour',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Indicateurs du jour
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 sm:divide-x sm:divide-gray-100">
        {stats.map((stat) => {
          const colors = getBarColor(stat.value, stat.threshold, stat.alertMode)

          return (
            <div key={stat.label} className="sm:px-4 first:pl-0 last:pr-0">
              {/* Label + hint */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="text-[10px] text-gray-400 hidden lg:block">
                  {stat.hint}
                </span>
              </div>

              {/* Valeur */}
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums',
                    colors.text
                  )}
                >
                  {stat.displayValue}
                </span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    colors.bg,
                    colors.text
                  )}
                >
                  {stat.alertMode === 'lower-is-better'
                    ? stat.value <= stat.threshold
                      ? '✓ OK'
                      : '↑ Haut'
                    : stat.value >= stat.threshold
                    ? '✓ OK'
                    : '↓ Bas'}
                </span>
              </div>

              {/* Jauge */}
              <GaugeBar
                value={stat.value}
                max={stat.max}
                threshold={stat.threshold}
                barColor={colors.bar}
              />

              {/* Légende seuil */}
              <p className="text-[10px] text-gray-400 mt-1.5">
                Seuil{' '}
                <span className="font-medium text-gray-500">
                  {stat.alertMode === 'lower-is-better'
                    ? `≤ ${stat.threshold}${stat.label.includes('%') || stat.hint.includes('%') ? ' %' : ''}`
                    : `≥ ${new Intl.NumberFormat('fr-FR').format(stat.threshold)}${stat.label.includes('€') || stat.hint.includes('€') ? ' €' : ''}`
                  }
                </span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
