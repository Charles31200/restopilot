'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { WeeklyDataPoint } from '@/types/dashboard'

// ── Props ─────────────────────────────────────────────────────

type RevenueChartProps = {
  data: WeeklyDataPoint[]
}

// ── Formatage ─────────────────────────────────────────────────

function formatEuros(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
  return `${value}€`
}

function formatCovers(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

// ── Tooltip personnalisé ──────────────────────────────────────

type TooltipPayload = {
  value: number
  payload: WeeklyDataPoint
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const revenue = payload[0].value

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xl min-w-[160px]">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
        Semaine du {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-gray-500">Chiffre d'affaires</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {formatEuros(revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-gray-500">Couverts</span>
          <span className="text-sm font-semibold text-gray-700 tabular-nums">
            {formatCovers(data.covers)}
          </span>
        </div>
        {data.foodCostPct > 0 && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-gray-500">Food cost</span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                data.foodCostPct < 30
                  ? 'text-green-600'
                  : data.foodCostPct < 40
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {data.foodCostPct.toFixed(1).replace('.', ',')} %
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Composant ─────────────────────────────────────────────────

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) return null

  // Calcul de la moyenne (semaines complètes seulement — exclut la dernière)
  const fullWeeks = data.slice(0, -1)
  const average =
    fullWeeks.length > 0
      ? Math.round(fullWeeks.reduce((s, w) => s + w.revenue, 0) / fullWeeks.length)
      : 0

  // Semaine en cours (dernière entrée) — barre légèrement transparente
  const currentWeekLabel = data[data.length - 1]?.label

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Chiffre d'affaires hebdomadaire
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            8 dernières semaines · semaine en cours en bleu clair
          </p>
        </div>
        {average > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Moyenne</p>
            <p className="text-sm font-semibold text-gray-600 tabular-nums">
              {formatEuros(average)}
            </p>
          </div>
        )}
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#F1F5F9"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: '#F8FAFC', radius: 6 }}
          />
          {/* Ligne pointillée de la moyenne */}
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#CBD5E1"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: 'moy.',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#94A3B8',
                dy: -4,
              }}
            />
          )}
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          >
            {data.map((entry) => (
              <Cell
                key={entry.startDate}
                fill={
                  entry.label === currentWeekLabel
                    ? '#BFDBFE'   // brand-200 — semaine en cours (partielle)
                    : '#2563EB'  // brand-600 — semaines passées
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
