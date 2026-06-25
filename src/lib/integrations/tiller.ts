/**
 * tiller.ts — Connecteur Tiller (désormais SumUp POS).
 *
 * Authentification : token API Bearer fourni par l'utilisateur.
 * L'utilisateur récupère son token dans son espace SumUp/Tiller →
 * Paramètres → API → Générer un token.
 *
 * Variables d'environnement : aucune (token stocké dans pos_integrations.api_key)
 */

import { createClient } from '@/lib/supabase/server'
import type { POSSale, POSSaleItem } from './types'

const TILLER_API_BASE = 'https://api.tillersystems.com/v1'

// ── Récupération du token stocké ──────────────────────────────

async function getApiToken(restaurantId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pos_integrations')
    .select('api_key')
    .eq('restaurant_id', restaurantId)
    .eq('pos_type', 'tiller')
    .single()

  if (error || !data?.api_key) throw new Error('Intégration Tiller non configurée')
  return data.api_key
}

// ── Parsing des transactions Tiller ──────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTillerTransaction(raw: any): POSSale {
  const items: POSSaleItem[] = (raw.rows ?? raw.orderRows ?? []).map((r: any) => ({
    dish_name:     r.name ?? r.label ?? 'Inconnu',
    quantity_sold: Math.max(1, Number(r.quantity) || 1),
    unit_price:    Number(r.price ?? r.unitPrice) || 0,
  }))

  // Tiller retourne les montants en centimes
  const totalCents = Number(raw.total ?? raw.amount ?? 0)
  const total = totalCents > 1000 ? totalCents / 100 : totalCents   // auto-détection centimes

  return {
    date:          raw.date?.split('T')[0] ?? raw.openedAt?.split('T')[0] ?? '',
    total_revenue: total,
    covers:        Number(raw.guests ?? raw.guestCount) || 1,
    items,
    pos_reference: String(raw.id ?? raw.transactionId ?? ''),
  }
}

// ── Fonction principale ───────────────────────────────────────

/**
 * Récupère toutes les ventes Tiller pour une date donnée.
 * @param restaurantId  UUID du restaurant dans PilotResto
 * @param date          Date ISO YYYY-MM-DD
 */
export async function getTillerSales(
  restaurantId: string,
  date: string
): Promise<POSSale[]> {
  const token = await getApiToken(restaurantId)

  const url = `${TILLER_API_BASE}/transactions?` +
    new URLSearchParams({ date, limit: '200' })

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error('Token Tiller invalide — vérifiez votre clé API dans les paramètres')
  }
  if (!res.ok) {
    throw new Error(`Tiller API erreur ${res.status}`)
  }

  const json = await res.json()
  const transactions: unknown[] = Array.isArray(json)
    ? json
    : (json.data ?? json.transactions ?? json.results ?? [])

  return (transactions as object[]).map(parseTillerTransaction)
}
