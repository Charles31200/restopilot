'use client'

/**
 * WeeklyBarChart — Graphe barres des 8 dernières semaines.
 * Hauteur fixe 180px, barres amber, fond transparent, axe minimal.
 * Tap sur une barre → BottomSheet avec détails (comportement natif mobile).
 */

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { WeeklyDataPoint } from '@/types/dashboard'

// ── Helper ────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ── Composant ─────────────────────────────────────────────────

export function WeeklyBarChart({ data }: { data: WeeklyDataPoint[] }) {
  const [selected, setSelected] = useState<WeeklyDataPoint | null>(null)

  // La dernière entrée = semaine courante (partielle) → légèrement plus claire
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          />
          {/* Tooltip desktop uniquement */}
          <Tooltip
            cursor={{ fill: 'var(--rp-lavender-light)', radius: 6 } as object}
            contentStyle={{
              background:   'var(--rp-white)',
              border:       '1px solid var(--rp-lavender)',
              borderRadius: '10px',
              boxShadow:    'var(--rp-shadow-card)',
              fontFamily:   'var(--font-body)',
              fontSize:     13,
            }}
            formatter={(value: unknown) => [fmt(Number(value)), 'CA']}
            labelStyle={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)', fontWeight: 600 }}
          />
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            cursor="pointer"
            onClick={(entry: unknown) => setSelected(entry as WeeklyDataPoint)}
          >
            {data.map((entry, index) => {
              const isLast    = index === data.length - 1
              const intensity = 0.45 + 0.55 * (entry.revenue / maxRevenue)
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isLast
                    ? `rgba(212,149,42,${intensity * 0.6})`   // semaine courante (partielle) = plus transparente
                    : `rgba(212,149,42,${intensity})`
                  }
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Bottom Sheet détails — mobile natif */}
      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.label ?? ''}
        description="Détails de la semaine"
      >
        {selected && (
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Chiffre d\'affaires', value: fmt(selected.revenue), color: 'var(--rp-amber)' },
                { label: 'Couverts',            value: String(selected.covers), color: 'var(--rp-blue)' },
                { label: 'Food cost',           value: `${selected.foodCostPct}%`, color: selected.foodCostPct > 32 ? 'var(--rp-danger)' : 'var(--rp-success)' },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-[14px] p-4"
                  style={{ background: 'var(--rp-lavender-light)', border: '1px solid var(--rp-lavender)' }}
                >
                  <p className="text-[24px] font-bold tabular-nums" style={{ color: item.color, fontFamily: 'var(--font-display)' }}>
                    {item.value}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  )
}
