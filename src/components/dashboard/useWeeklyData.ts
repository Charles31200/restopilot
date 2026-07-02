'use client'

import { useState, useEffect } from 'react'
import type { WeeklyDataPoint } from '@/types/dashboard'

export const SALE_ADDED_EVENT = 'rp:sale-added'

export function useWeeklyData(initialData: WeeklyDataPoint[]): WeeklyDataPoint[] {
  const [data, setData] = useState<WeeklyDataPoint[]>(initialData)

  // Sync with new props delivered by router.refresh() — useState ignores prop
  // changes after initial mount, so we need this effect to pick them up.
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Fallback: fetch fresh data when a sale is saved, in case router.refresh()
  // hasn't propagated new props yet (RSC reconciliation can be async).
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/dashboard/summary', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (Array.isArray(json.weeklyData) && json.weeklyData.length > 0) {
          setData(json.weeklyData)
        }
      } catch {
        // silencieux — on garde les données existantes en cas d'erreur réseau
      }
    }

    window.addEventListener(SALE_ADDED_EVENT, refresh)
    return () => window.removeEventListener(SALE_ADDED_EVENT, refresh)
  }, [])

  return data
}
