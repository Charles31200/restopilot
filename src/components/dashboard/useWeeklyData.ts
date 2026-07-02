'use client'

import { useState, useEffect } from 'react'
import type { WeeklyDataPoint } from '@/types/dashboard'

// Nom de l'événement déclenché par DashboardActions après chaque vente enregistrée.
// Les charts l'écoutent pour refetcher /api/dashboard/summary indépendamment
// de router.refresh(), qui ne propage pas toujours les nouvelles props aux
// Client Components pré-montés en Next.js App Router.
export const SALE_ADDED_EVENT = 'rp:sale-added'

export function useWeeklyData(initialData: WeeklyDataPoint[]): WeeklyDataPoint[] {
  // Initialise l'état avec les données envoyées par le Server Component.
  // Après le montage, l'état n'est plus synchronisé avec les props (intentionnel :
  // évite d'écraser des données fraîches si router.refresh() envoie une version
  // intermédiaire des props avant que le fetch côté client soit terminé).
  const [data, setData] = useState<WeeklyDataPoint[]>(initialData)

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/dashboard/summary')
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
