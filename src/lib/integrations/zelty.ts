/**
 * zelty.ts — Connecteur Zelty (caisse cloud française).
 *
 * Authentification : clé API passée en header X-Api-Key.
 * L'utilisateur récupère sa clé dans Zelty → Mon compte → API.
 *
 * Variables d'environnement : aucune (clé stockée dans pos_integrations.api_key)
 */

import { createClient } from '@/lib/supabase/server'
import type { POSSale, POSSaleItem } from './types'

const ZELTY_API_BASE = 'https://api.zelty.fr/v2'

// ── Récupération de la clé stockée ────────────────────────────

async function getApiKey(restaurantId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pos_integrations')
    .select('api_key')
    .eq('restaurant_id', restaurantId)
    .eq('pos_type', 'zelty')
    .single()

  if (error || !data?.api_key) throw new Error('Intégration Zelty non configurée')
  return data.api_key
}

// ── Parsing des ventes Zelty ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseZeltySale(raw: any): POSSale {
  const items: POSSaleItem[] = (raw.items ?? raw.lines ?? raw.orderItems ?? []).map((i: any) => ({
    dish_name:     i.name ?? i.label ?? i.product_name ?? 'Inconnu',
    quantity_sold: Math.max(1, Number(i.quantity ?? i.qty) || 1),
    unit_price:    Number(i.price ?? i.unit_price ?? i.unitPrice) || 0,
  }))

  // Zelty retourne des montants TTC en euros (float)
  const total = Number(raw.total ?? raw.total_ttc ?? raw.amount) || 0

  return {
    date:          (raw.date ?? raw.created_at ?? '').split('T')[0],
    total_revenue: total,
    covers:        Number(raw.guests ?? raw.covers ?? raw.guest_count) || 1,
    items,
    pos_reference: String(raw.id ?? raw.order_id ?? raw.ticket_number ?? ''),
  }
}

// ── Fonction principale ───────────────────────────────────────

/**
 * Récupère toutes les ventes Zelty pour une date donnée.
 * @param restaurantId  UUID du restaurant dans RestoPilot
 * @param date          Date ISO YYYY-MM-DD
 */
export async function getZeltySales(
  restaurantId: string,
  date: string
): Promise<POSSale[]> {
  const apiKey = await getApiKey(restaurantId)

  const url = `${ZELTY_API_BASE}/sales?` +
    new URLSearchParams({
      date,
      per_page: '200',
      page:     '1',
    })

  const res = await fetch(url, {
    headers: {
      'X-Api-Key':    apiKey,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error('Clé API Zelty invalide — vérifiez votre clé dans les paramètres')
  }
  if (!res.ok) {
    throw new Error(`Zelty API erreur ${res.status}`)
  }

  const json = await res.json()
  const sales: unknown[] = Array.isArray(json)
    ? json
    : (json.data ?? json.sales ?? json.results ?? [])

  return (sales as object[]).map(parseZeltySale)
}
