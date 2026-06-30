'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeeklyDataPoint } from '@/types/dashboard'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function makeLastDot(lastIndex: number) {
  return function LastDot(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index } = props
    if (cx === undefined || cy === undefined || index !== lastIndex) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={14} fill="#F0F0F0" />
        <circle cx={cx} cy={cy} r={4.5} fill="#111111" />
      </g>
    )
  }
}

export function RevenueLineChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#F0F0F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#BBBBBB', fontFamily: 'var(--font-body)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#BBBBBB', fontFamily: 'var(--font-body)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k €`}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: '#E5E5E5' }}
          contentStyle={{
            background:   '#FFFFFF',
            border:       '1px solid #E5E5E5',
            borderRadius: '8px',
            fontFamily:   'var(--font-body)',
            fontSize:     13,
          }}
          formatter={(value: unknown) => [fmt(Number(value)), 'CA']}
          labelStyle={{ color: '#111111', fontFamily: 'var(--font-display)', fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#111111"
          strokeWidth={2}
          dot={makeLastDot(data.length - 1)}
          activeDot={{ r: 4, fill: '#111111' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
