'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatMonthLabel } from '@/lib/utils/week-utils'
import type { MonthlyFinancials } from '@/types/comptabilite'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── KPI Card ──────────────────────────────────────────────────

function KPI({ label, value, pct, color, trend }: {
  label:  string
  value:  number
  pct?:   number
  color:  string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className={cn('rounded-2xl p-4 border', color)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{fmt(value)}</p>
      {pct !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend === 'up'   && <TrendingUp   className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          <span className="text-xs font-medium">{pct.toFixed(1)} % du CA</span>
        </div>
      )}
    </div>
  )
}

// ── Tooltip donut ─────────────────────────────────────────────

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{payload[0].name}</p>
      <p className="text-gray-600 tabular-nums">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────

export function FinancialDashboard() {
  const [month,     setMonth]     = useState(currentMonthStr())
  const [data,      setData]      = useState<MonthlyFinancials | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async (m: string) => {
    setIsLoading(true)
    try {
      const res  = await fetch(`/api/comptabilite/monthly?month=${m}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchData(month) }, [month, fetchData])

  const donutData = data
    ? [
        { name: 'Achats matières', value: data.purchases, color: '#EF4444' },
        { name: 'Personnel',       value: data.laborCost, color: '#F97316' },
        { name: 'Marge brute',     value: Math.max(0, data.grossMargin), color: '#22C55E' },
      ].filter(d => d.value > 0)
    : []

  return (
    <div className="space-y-6">
      {/* Sélecteur de mois */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMonth(prevMonth(month))}
          className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center capitalize">
          {formatMonthLabel(month)}
        </span>
        <button
          onClick={() => setMonth(nextMonth(month))}
          disabled={month >= currentMonthStr()}
          className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* 4 KPI Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KPI label="CA total"        value={data.revenue}    color="bg-blue-50  text-blue-800  border-blue-200" />
            <KPI label="Total achats"    value={data.purchases}  color="bg-red-50   text-red-800   border-red-200"
              pct={data.purchasesPct} trend={data.purchasesPct > 35 ? 'down' : 'neutral'} />
            <KPI label="Masse salariale" value={data.laborCost}  color="bg-amber-50 text-amber-800 border-amber-200"
              pct={data.laborPct} trend={data.laborPct > 38 ? 'down' : 'neutral'} />
            <KPI label="Marge brute"     value={data.grossMargin} color={cn(
              data.grossMargin >= 0
                ? 'bg-green-50  text-green-800  border-green-200'
                : 'bg-red-50    text-red-800    border-red-200'
            )}
              pct={data.grossMarginPct} trend={data.grossMarginPct > 20 ? 'up' : 'down'} />
          </div>

          {/* Graphe donut + tableau */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Donut */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Répartition des charges
              </h3>
              {donutData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex-1 space-y-3">
                    {donutData.map(d => (
                      <div key={d.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold tabular-nums">{fmt(d.value)}</p>
                          {data.revenue > 0 && (
                            <p className="text-[10px] text-gray-400">
                              {(d.value / data.revenue * 100).toFixed(0)} %
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-36 text-gray-400 text-sm">
                  Aucune donnée pour ce mois.
                </div>
              )}
            </div>

            {/* Tableau hebdo */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Ventilation hebdomadaire
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Sem.', 'CA', 'Achats', 'Personnel', 'Marge'].map(h => (
                        <th key={h} className="pb-2 text-left font-semibold text-gray-400 uppercase tracking-wide pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.weeklyBreakdown.map(w => (
                      <tr key={w.weekLabel} className="hover:bg-gray-50/50">
                        <td className="py-2 font-semibold text-gray-700 pr-3">{w.weekLabel}</td>
                        <td className="py-2 tabular-nums pr-3">{fmt(w.revenue)}</td>
                        <td className="py-2 tabular-nums pr-3 text-red-600">{fmt(w.purchases)}</td>
                        <td className="py-2 tabular-nums pr-3 text-amber-600">{fmt(w.laborCost)}</td>
                        <td className={cn('py-2 tabular-nums font-semibold', w.grossMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {fmt(w.grossMargin)}
                          <span className="font-normal text-gray-400 ml-1">({w.grossMarginPct} %)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 font-semibold">
                      <td className="pt-2 text-gray-700">Total</td>
                      <td className="pt-2 tabular-nums">{fmt(data.revenue)}</td>
                      <td className="pt-2 tabular-nums text-red-600">{fmt(data.purchases)}</td>
                      <td className="pt-2 tabular-nums text-amber-600">{fmt(data.laborCost)}</td>
                      <td className={cn('pt-2 tabular-nums', data.grossMargin >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {fmt(data.grossMargin)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !isLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 text-sm">
          Aucune donnée pour ce mois.
        </div>
      )}
    </div>
  )
}
