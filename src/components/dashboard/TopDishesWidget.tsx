import { cn } from '@/lib/utils/cn'
import type { TopDish } from '@/types/dashboard'

// ── Helpers ───────────────────────────────────────────────────

function formatEuros(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Code couleur food cost : vert < 30 %, orange 30-40 %, rouge > 40 % */
function foodCostColor(pct: number): string {
  if (pct < 30) return 'text-green-600 bg-green-50'
  if (pct < 40) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

/** Barre de progression food cost (0–50 % max) */
function FoodCostBar({ pct }: { pct: number }) {
  const width = Math.min((pct / 50) * 100, 100)
  const color = pct < 30 ? '#22C55E' : pct < 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums min-w-[52px] text-center',
          foodCostColor(pct)
        )}
      >
        {pct.toFixed(1).replace('.', ',')} %
      </span>
    </div>
  )
}

// ── Médaille de rang ──────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700',
    2: 'bg-gray-100 text-gray-600',
    3: 'bg-orange-100 text-orange-700',
  }
  return (
    <span
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
        styles[rank] ?? 'bg-gray-50 text-gray-400'
      )}
    >
      {rank}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────

type TopDishesWidgetProps = {
  dishes: TopDish[]
}

// ── Composant ─────────────────────────────────────────────────

export function TopDishesWidget({ dishes }: TopDishesWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Top 5 plats de la semaine
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Classés par quantité vendue
          </p>
        </div>
        {/* Légende food cost */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          {'<'} 30 %
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-1" />
          30–40 %
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block ml-1" />
          {'>'} 40 %
        </div>
      </div>

      {/* Table */}
      {dishes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune vente enregistrée cette semaine.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 -mx-1">
          {/* Header colonnes */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-2 pb-2 border-b border-gray-100">
            <div className="w-6" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Plat
            </span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">
              Qté
            </span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right min-w-[60px]">
              CA
            </span>
          </div>

          {/* Lignes */}
          {dishes.map((dish) => (
            <div
              key={dish.rank}
              className="group px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {/* Ligne principale */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center mb-2">
                <RankBadge rank={dish.rank} />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {dish.name}
                </span>
                <span className="text-sm font-semibold text-gray-700 tabular-nums text-right">
                  {dish.quantity}
                </span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums text-right min-w-[60px]">
                  {formatEuros(dish.revenue)}
                </span>
              </div>
              {/* Barre food cost */}
              <div className="pl-9">
                <FoodCostBar pct={dish.foodCostPct} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
