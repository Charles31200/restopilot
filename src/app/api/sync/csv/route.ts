/**
 * POST /api/sync/csv
 * Import des ventes depuis un fichier CSV.
 * Reçoit un multipart/form-data avec :
 *   - file : File (CSV)
 *   - mapping? : JSON stringifié du ColumnMapping (si colonnes non standard)
 *
 * Retourne : { imported, skipped, errors[], salesCreated, stockUpdated }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCSVBuffer } from '@/lib/integrations/csv-import'
import { processDestock }  from '@/lib/utils/destock'
import type { ColumnMapping } from '@/lib/integrations/csv-import'

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  // Récupérer le fichier
  let formData: FormData
  try { formData = await request.formData() }
  catch { return NextResponse.json({ error: 'Requête multipart invalide' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Aucun fichier (champ "file" manquant)' }, { status: 400 })

  // Mapping optionnel
  let mapping: ColumnMapping | undefined
  const mappingRaw = formData.get('mapping')
  if (typeof mappingRaw === 'string') {
    try { mapping = JSON.parse(mappingRaw) } catch { /* ignorer */ }
  }

  // Parser le CSV
  const buffer = await file.arrayBuffer()
  const parsed = parseCSVBuffer(buffer, mapping)

  if (parsed.sales.length === 0) {
    return NextResponse.json({
      imported:     0,
      skipped:      parsed.skipped,
      errors:       parsed.errors,
      salesCreated: 0,
      stockUpdated: false,
    }, { status: 422 })
  }

  // Insérer les ventes
  let salesCreated   = 0
  let stockUpdated   = false
  const insertErrors: string[] = parsed.errors.map(e => e.message)

  for (const sale of parsed.sales) {
    // Dédupliquer par date + source 'import'
    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('date', sale.date)
      .eq('source', 'import')
      .maybeSingle()

    if (existing) continue  // déjà importé pour cette date

    const { data: created, error: saleError } = await supabase
      .from('sales')
      .insert({
        restaurant_id: restaurantId,
        date:          sale.date,
        total_revenue: sale.total_revenue,
        covers:        sale.covers,
        source:        'import' as const,
      })
      .select('id')
      .single()

    if (saleError || !created) {
      insertErrors.push(`${sale.date}: ${saleError?.message ?? 'Erreur inconnue'}`)
      continue
    }

    // Insérer les sale_items
    if (sale.items.length > 0) {
      await supabase.from('sale_items').insert(
        sale.items.map(i => ({
          sale_id:       created.id,
          restaurant_id: restaurantId,
          dish_name:     i.dish_name,
          quantity_sold: i.quantity_sold,
          unit_price:    i.unit_price,
          recipe_id:     null,
        }))
      )

      // Déstockage automatique
      const destockResult = await processDestock(
        restaurantId,
        sale.items.map(i => ({ dish_name: i.dish_name, quantity_sold: i.quantity_sold, sale_id: created.id }))
      )
      if (destockResult.processed > 0) stockUpdated = true
      if (destockResult.errors.length > 0) {
        insertErrors.push(...destockResult.errors.map(e => `Déstock: ${e}`))
      }
    }

    salesCreated++
  }

  return NextResponse.json({
    imported:     parsed.imported,
    skipped:      parsed.skipped,
    errors:       insertErrors,
    salesCreated,
    stockUpdated,
  })
}
