'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeeklyDataPoint } from '@/types/dashboard'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export function RevenueBarChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
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
          cursor={{ fill: '#F5F5F5' }}
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
        <Bar dataKey="revenue" fill="#111111" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
