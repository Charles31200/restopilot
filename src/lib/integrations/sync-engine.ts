/**
 * sync-engine.ts — Moteur central de synchronisation des ventes.
 *
 * Appelé par :
 *  - POST /api/sync          (sync manuelle, utilisateur authentifié)
 *  - GET  /api/cron/sync     (sync automatique, via Vercel Cron Jobs)
 *
 * Flux par restaurant :
 *  1. Lire l'intégration active dans pos_integrations
 *  2. Appeler le bon connecteur pour récupérer les ventes du jour
 *  3. Dédupliquer via pos_reference (évite les doubles créations)
 *  4. Insérer dans `sales` + `sale_items`
 *  5. Déclencher le déstockage automatique via processDestock()
 *  6. Mettre à jour last_synced_at (ou sync_error si échec)
 */

import { createClient } from '@/lib/supabase/server'
import { processDestock } from '@/lib/utils/destock'
import { getLightspeedSales } from './lightspeed'
import { getTillerSales }     from './tiller'
import { getZeltySales }      from './zelty'
import type { POSSale, SyncResult } from './types'

// ── Sélection du connecteur ───────────────────────────────────

async function fetchSalesFromPOS(
  restaurantId: string,
  posType:      string,
  date:         string
): Promise<POSSale[]> {
  switch (posType) {
    case 'lightspeed': return getLightspeedSales(restaurantId, date)
    case 'tiller':     return getTillerSales(restaurantId, date)
    case 'zelty':      return getZeltySales(restaurantId, date)
    default:
      throw new Error(`Type de caisse non supporté pour la sync automatique : ${posType}`)
  }
}

// ── Insertion dans Supabase ───────────────────────────────────

async function saveSale(
  restaurantId: string,
  sale:         POSSale,
  posType:      string
): Promise<{ saleId: string; isNew: boolean }> {
  const supabase = await createClient()

  // Vérifier si la vente existe déjà (déduplication par pos_reference + date)
  if (sale.pos_reference) {
    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('pos_reference', sale.pos_reference)
      .single()

    if (existing) return { saleId: existing.id, isNew: false }
  }

  // Créer la vente
  const { data: created, error } = await supabase
    .from('sales')
    .insert({
      restaurant_id: restaurantId,
      date:          sale.date,
      total_revenue: sale.total_revenue,
      covers:        sale.covers,
      source:        'pos' as const,
      pos_reference: sale.pos_reference ?? null,
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(`Erreur insertion vente : ${error?.message}`)

  // Insérer les lignes de vente
  if (sale.items.length > 0) {
    const saleItems = sale.items.map(item => ({
      sale_id:       created.id,
      restaurant_id: restaurantId,
      dish_name:     item.dish_name,
      quantity_sold: item.quantity_sold,
      unit_price:    item.unit_price,
      recipe_id:     null,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw new Error(`Erreur insertion sale_items : ${itemsError.message}`)
  }

  return { saleId: created.id, isNew: true }
}

// ── Mise à jour du statut de sync ─────────────────────────────

async function updateSyncStatus(
  restaurantId: string,
  error:        string | null
) {
  const supabase = await createClient()
  await supabase
    .from('pos_integrations')
    .update({
      last_synced_at: error ? undefined : new Date().toISOString(),
      sync_error:     error,
      updated_at:     new Date().toISOString(),
    })
    .eq('restaurant_id', restaurantId)
}

// ── Fonction principale ───────────────────────────────────────

/**
 * Synchronise les ventes d'un restaurant pour une ou plusieurs dates.
 * @param restaurantId  UUID du restaurant
 * @param dates         Dates à synchroniser (défaut : aujourd'hui)
 */
export async function syncRestaurant(
  restaurantId: string,
  dates?:       string[]
): Promise<SyncResult> {
  const result: SyncResult = {
    success:        false,
    salesCreated:   0,
    itemsProcessed: 0,
    stockUpdated:   false,
    errors:         [],
  }

  const supabase = await createClient()

  // 1. Récupérer l'intégration active
  const { data: integration, error: intError } = await supabase
    .from('pos_integrations')
    .select('pos_type, is_active')
    .eq('restaurant_id', restaurantId)
    .single()

  if (intError || !integration) {
    result.errors.push('Aucune intégration configurée pour ce restaurant')
    return result
  }

  if (!integration.is_active) {
    result.errors.push('Intégration désactivée')
    return result
  }

  // 2. Dates à synchroniser
  const today      = new Date().toISOString().split('T')[0]
  const syncDates  = dates?.length ? dates : [today]

  // 3. Pour chaque date, récupérer et insérer les ventes
  for (const date of syncDates) {
    try {
      const sales = await fetchSalesFromPOS(restaurantId, integration.pos_type, date)

      for (const sale of sales) {
        try {
          const { saleId, isNew } = await saveSale(restaurantId, sale, integration.pos_type)

          if (isNew) {
            result.salesCreated++
            result.itemsProcessed += sale.items.length

            // 4. Déstockage automatique
            if (sale.items.length > 0) {
              const destockItems = sale.items.map(i => ({
                dish_name:     i.dish_name,
                quantity_sold: i.quantity_sold,
                sale_id:       saleId,
              }))
              const destockResult = await processDestock(restaurantId, destockItems)
              if (destockResult.errors.length > 0) {
                result.errors.push(...destockResult.errors.map(e => `Déstock: ${e}`))
              }
              result.stockUpdated = true
            }
          }
        } catch (saleErr) {
          result.errors.push(`Vente ${sale.pos_reference ?? date}: ${String(saleErr)}`)
        }
      }
    } catch (dateErr) {
      result.errors.push(`${date}: ${String(dateErr)}`)
    }
  }

  // 5. Mettre à jour le statut
  const syncError = result.errors.length > 0 ? result.errors[0] : null
  await updateSyncStatus(restaurantId, syncError)

  result.success = result.salesCreated > 0 || result.errors.length === 0
  return result
}
