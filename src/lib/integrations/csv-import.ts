/**
 * csv-import.ts — Parseur CSV universel pour l'import des ventes.
 *
 * Template RestoPilot standard :
 *   date,heure,plat,quantite,prix_unitaire,total
 *
 * Mais les caisses exportent des colonnes avec des noms différents.
 * Ce module détecte automatiquement les colonnes, propose un mapping,
 * et valide chaque ligne avec zod avant insertion.
 *
 * Gestion encodage : UTF-8 (défaut) + ISO-8859-1 / Windows-1252
 * via l'API TextDecoder disponible dans Node.js et les navigateurs.
 */

import { z } from 'zod'
import type { POSSale, POSSaleItem, CSVImportResult } from './types'

// ── Schéma de validation d'une ligne ─────────────────────────

const RowSchema = z.object({
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  dish_name:    z.string().min(1, 'Nom du plat requis').max(120),
  quantity:     z.number().int().positive('Quantité doit être > 0'),
  unit_price:   z.number().min(0,   'Prix unitaire doit être ≥ 0'),
  total:        z.number().min(0,   'Total doit être ≥ 0'),
  time:         z.string().optional(),
})

type ValidatedRow = z.infer<typeof RowSchema>

// ── Colonnes reconnues (noms alternatifs par colonne cible) ───

const COLUMN_ALIASES: Record<string, string[]> = {
  date:        ['date', 'jour', 'day', 'transaction_date', 'sale_date', 'vente_date'],
  time:        ['heure', 'time', 'hour', 'transaction_time', 'sale_time'],
  dish_name:   ['plat', 'article', 'item', 'product', 'produit', 'dish', 'name',
                'nom', 'label', 'description', 'designation'],
  quantity:    ['quantite', 'quantité', 'qty', 'quantity', 'qte', 'nb', 'nombre'],
  unit_price:  ['prix_unitaire', 'prix_unit', 'unit_price', 'price', 'prix', 'pu',
                'montant_unitaire'],
  total:       ['total', 'montant', 'amount', 'total_ttc', 'total_ht', 'subtotal',
                'sous_total', 'line_total'],
}

// ── Normalisation d'un nom de colonne ─────────────────────────

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // enlever les accents
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// ── Détection automatique des colonnes ────────────────────────

export type ColumnMapping = Record<string, string>  // cible → header CSV

export function detectColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const mapping: ColumnMapping = {}

  for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias)
      if (idx !== -1) { mapping[target] = headers[idx]; break }
    }
  }

  return mapping
}

// ── Décodage du buffer avec détection d'encodage ─────────────

/**
 * Tente de décoder le buffer en UTF-8.
 * Si le résultat contient des caractères de remplacement (U+FFFD),
 * on retente en Windows-1252 (latin-1 étendu, fréquent sur les exports Windows).
 */
export function decodeBuffer(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  if (!utf8.includes('�')) return utf8
  try {
    return new TextDecoder('windows-1252', { fatal: false }).decode(buffer)
  } catch {
    return utf8   // fallback UTF-8 si windows-1252 non supporté
  }
}

// ── Split CSV robuste (gère les guillemets et virgules imbriquées) ──

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; i += 2; continue
      }
      inQuotes = !inQuotes
    } else if (!inQuotes && line.slice(i, i + delimiter.length) === delimiter) {
      result.push(current.trim())
      current = ''
      i += delimiter.length
      continue
    } else {
      current += ch
    }
    i++
  }
  result.push(current.trim())
  return result
}

// ── Détection du délimiteur ────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 }
  for (const ch of firstLine) {
    if (ch in counts) counts[ch as keyof typeof counts]++
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
}

// ── Parsing principal ─────────────────────────────────────────

export function parseCSVContent(
  content:  string,
  mapping?: ColumnMapping
): CSVImportResult {
  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) {
    return { imported: 0, skipped: 0, errors: [{ row: 0, message: 'Fichier vide ou sans données' }], sales: [] }
  }

  const delimiter = detectDelimiter(lines[0])
  const headers   = splitCSVLine(lines[0], delimiter)
  const autoMap   = mapping ?? detectColumns(headers)

  // Indexer les colonnes par position
  const colIndex = (target: string): number => {
    const header = autoMap[target]
    return header ? headers.indexOf(header) : -1
  }

  const dateIdx      = colIndex('date')
  const dishIdx      = colIndex('dish_name')
  const qtyIdx       = colIndex('quantity')
  const priceIdx     = colIndex('unit_price')
  const totalIdx     = colIndex('total')
  const timeIdx      = colIndex('time')

  if (dateIdx === -1 || dishIdx === -1) {
    return {
      imported: 0,
      skipped:  lines.length - 1,
      errors:   [{ row: 0, message: `Colonnes obligatoires manquantes. Détectées : ${headers.join(', ')}` }],
      sales:    [],
    }
  }

  // Regrouper les lignes par date (1 Sale par date)
  const salesByDate = new Map<string, { items: POSSaleItem[]; revenue: number; covers: Set<string> }>()

  const errors: CSVImportResult['errors'] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], delimiter)
    if (cols.length < 2) { skipped++; continue }

    // Normaliser la date (accepte YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
    let rawDate = cols[dateIdx]?.trim() ?? ''
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('/')
      rawDate = `${y}-${m}-${d}`
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('-')
      rawDate = `${y}-${m}-${d}`
    }

    const parseNum = (idx: number) => {
      if (idx === -1) return 0
      return parseFloat((cols[idx] ?? '0').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0
    }

    const rowData = {
      date:       rawDate,
      dish_name:  cols[dishIdx]?.trim()  ?? '',
      quantity:   Math.round(parseNum(qtyIdx))   || 1,
      unit_price: parseNum(priceIdx),
      total:      parseNum(totalIdx),
      time:       timeIdx !== -1 ? cols[timeIdx]?.trim() : undefined,
    }

    const parsed = RowSchema.safeParse(rowData)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e: { message: string }) => e.message).join('; ')
      errors.push({ row: i + 1, message: `Ligne ${i + 1} : ${msg}` })
      skipped++
      continue
    }

    const row: ValidatedRow = parsed.data
    const entry = salesByDate.get(row.date) ?? { items: [], revenue: 0, covers: new Set() }

    entry.items.push({
      dish_name:     row.dish_name,
      quantity_sold: row.quantity,
      unit_price:    row.unit_price,
    })
    entry.revenue += row.total || row.unit_price * row.quantity
    if (row.time) entry.covers.add(row.time.slice(0, 2))   // heure approx comme proxy couverts
    salesByDate.set(row.date, entry)
  }

  const sales: POSSale[] = [...salesByDate.entries()].map(([date, entry]) => ({
    date,
    total_revenue: +entry.revenue.toFixed(2),
    covers:        entry.covers.size || entry.items.reduce((s, i) => s + i.quantity_sold, 0),
    items:         entry.items,
  }))

  const imported = sales.reduce((s, sale) => s + sale.items.length, 0)

  return { imported, skipped, errors, sales }
}

// ── Parsing depuis un ArrayBuffer (upload navigateur) ─────────

export function parseCSVBuffer(buffer: ArrayBuffer, mapping?: ColumnMapping): CSVImportResult {
  const content = decodeBuffer(buffer)
  return parseCSVContent(content, mapping)
}

// ── Extraction des en-têtes (pour le mapping UI) ──────────────

export function extractCSVHeaders(content: string): string[] {
  const firstLine = content.split(/\r?\n/)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  return splitCSVLine(firstLine, delimiter)
}

// ── Template CSV téléchargeable ───────────────────────────────

export const CSV_TEMPLATE =
  'date,heure,plat,quantite,prix_unitaire,total\r\n' +
  '2026-06-06,12:30,Entrecôte,2,18.50,37.00\r\n' +
  '2026-06-06,12:30,Salade César,1,12.00,12.00\r\n' +
  '2026-06-06,19:45,Magret de canard,3,22.00,66.00\r\n'
