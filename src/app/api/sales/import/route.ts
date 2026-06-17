/**
 * POST /api/sales/import
 *
 * Body JSON :
 *   rows        : ParsedSaleRow[]  — lignes déjà parsées côté client
 *   filename    : string           — nom du fichier source (pour pos_reference)
 *   onDuplicate : 'replace' | 'skip'
 *
 * Retourne :
 *   { inserted, replaced, skipped, errors }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ParsedSaleRow } from '@/lib/integrations/sales-csv-parser'

type ImportBody = {
  rows:        ParsedSaleRow[]
  filename:    string
  onDuplicate: 'replace' | 'skip'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  const restaurantId = profile?.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })

  let body: ImportBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { rows, filename, onDuplicate } = body

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne à importer' }, { status: 400 })
  }

  let inserted  = 0
  let replaced  = 0
  let skipped   = 0
  const errors: string[] = []

  for (const row of rows) {
    // Validation minimale
    if (!row.date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push(`Date invalide : "${row.date}"`)
      skipped++
      continue
    }
    if (typeof row.total_revenue !== 'number' || row.total_revenue < 0) {
      errors.push(`Montant invalide pour le ${row.date}`)
      skipped++
      continue
    }

    // Chercher un doublon (même restaurant, même date, source = 'import')
    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('date', row.date)
      .eq('source', 'import')
      .maybeSingle()

    if (existing) {
      if (onDuplicate === 'skip') {
        skipped++
        continue
      }
      // replace : mettre à jour la ligne existante
      const { error: updateErr } = await supabase
        .from('sales')
        .update({
          total_revenue: row.total_revenue,
          covers:        row.covers ?? 0,
          pos_reference: filename,
        })
        .eq('id', existing.id)

      if (updateErr) {
        errors.push(`${row.date} : ${updateErr.message}`)
        skipped++
      } else {
        replaced++
      }
      continue
    }

    // Insertion
    const { error: insertErr } = await supabase
      .from('sales')
      .insert({
        restaurant_id: restaurantId,
        date:          row.date,
        total_revenue: row.total_revenue,
        covers:        row.covers ?? 0,
        source:        'import',
        pos_reference: filename,
      })

    if (insertErr) {
      errors.push(`${row.date} : ${insertErr.message}`)
      skipped++
    } else {
      inserted++
    }
  }

  return NextResponse.json({ inserted, replaced, skipped, errors })
}
