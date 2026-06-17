/**
 * sales-csv-parser.ts
 *
 * Parser CSV flexible pour l'import de ventes journalières depuis une caisse.
 * Format attendu : une ligne = une journée (ou plusieurs lignes par jour agrégées).
 * Colonnes cibles : date, total_revenue, covers (optionnel).
 *
 * Utilise papaparse pour le parsing robuste (guillemets, encodages, délimiteurs).
 */

import Papa from 'papaparse'

// ── Mapping cible → alias reconnus ───────────────────────────

const DATE_ALIASES    = ['date', 'jour', 'day', 'date_vente', 'sale_date', 'transaction_date', 'période', 'periode']
const REVENUE_ALIASES = ['total', 'montant', 'ca', 'chiffre_affaire', 'chiffre_d_affaire', 'revenue',
                         'total_revenue', 'total_ttc', 'total_ht', 'ventes', 'recette', 'recettes',
                         'amount', 'sum', 'turnover']
const COVERS_ALIASES  = ['couverts', 'covers', 'clients', 'nb_couverts', 'nb_clients',
                         'guests', 'pax', 'personnes', 'tables']

// ── Types exportés ────────────────────────────────────────────

export type SalesColumnMapping = {
  date:          string | null
  total_revenue: string | null
  covers:        string | null
}

export type ParsedSaleRow = {
  date:          string    // YYYY-MM-DD
  total_revenue: number
  covers:        number | null
}

export type SalesParseResult = {
  headers:   string[]
  autoMap:   SalesColumnMapping
  rows:      ParsedSaleRow[]
  rawRows:   Record<string, string>[]  // données brutes pour l'aperçu
  skipped:   number
  errors:    { row: number; message: string }[]
}

// ── Normalisation des noms de colonnes ────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // enlever accents
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function findColumn(headers: string[], aliases: string[]): string | null {
  const normHeaders = headers.map(normalize)
  for (const alias of aliases) {
    const idx = normHeaders.indexOf(normalize(alias))
    if (idx !== -1) return headers[idx]
  }
  return null
}

// ── Détection automatique du mapping ─────────────────────────

export function detectSalesColumns(headers: string[]): SalesColumnMapping {
  return {
    date:          findColumn(headers, DATE_ALIASES),
    total_revenue: findColumn(headers, REVENUE_ALIASES),
    covers:        findColumn(headers, COVERS_ALIASES),
  }
}

// ── Normalisation de la date ──────────────────────────────────

function parseDate(raw: string): string | null {
  const s = raw.trim()
  // YYYY-MM-DD (déjà ok)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // MM/DD/YYYY (format américain)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
    return s.replace(/\//g, '-')
  }
  // DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
    const [d, m, y] = s.split('.')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

// ── Normalisation d'un montant ────────────────────────────────

function parseAmount(raw: string): number | null {
  // Supprimer les espaces, le symbole €, les espaces insécables
  const cleaned = raw
    .replace(/\s/g, '')
    .replace('€', '')
    .replace('$', '')
    .replace(/ /g, '')  // espace insécable
    // Format français : 1 234,56 → 1234.56
    .replace(/\.(?=\d{3}(?:[,\s]|$))/g, '')  // séparateur de milliers avec point
    .replace(/\s/g, '')
    .replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

// ── Parse principal (client-side, depuis string décodée) ──────

export function parseSalesCSV(
  content: string,
  mapping: SalesColumnMapping
): SalesParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header:       true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  const headers  = result.meta.fields ?? []
  const autoMap  = detectSalesColumns(headers)
  const useMap   = {
    date:          mapping.date          ?? autoMap.date,
    total_revenue: mapping.total_revenue ?? autoMap.total_revenue,
    covers:        mapping.covers        ?? autoMap.covers,
  }

  const rows:    ParsedSaleRow[]                = []
  const errors:  { row: number; message: string }[] = []
  let   skipped  = 0

  // Agrégation par date (au cas où il y a plusieurs lignes par jour)
  const byDate = new Map<string, { revenue: number; covers: number | null }>()

  for (let i = 0; i < result.data.length; i++) {
    const raw = result.data[i]
    const rowNum = i + 2  // +1 header, +1 base 1

    // Date
    if (!useMap.date) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum} : colonne "date" non mappée` })
      skipped++
      continue
    }
    const rawDate = raw[useMap.date] ?? ''
    const date = parseDate(rawDate)
    if (!date) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum} : date invalide "${rawDate}"` })
      skipped++
      continue
    }

    // Montant
    if (!useMap.total_revenue) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum} : colonne "montant" non mappée` })
      skipped++
      continue
    }
    const rawAmount = raw[useMap.total_revenue] ?? ''
    const amount = parseAmount(rawAmount)
    if (amount === null || amount < 0) {
      errors.push({ row: rowNum, message: `Ligne ${rowNum} : montant invalide "${rawAmount}"` })
      skipped++
      continue
    }

    // Couverts (optionnel)
    let covers: number | null = null
    if (useMap.covers) {
      const rawCovers = raw[useMap.covers] ?? ''
      const n = parseInt(rawCovers.replace(/\D/g, ''), 10)
      if (!isNaN(n) && n >= 0) covers = n
    }

    // Agréger par date
    const existing = byDate.get(date)
    if (existing) {
      existing.revenue += amount
      if (covers !== null) existing.covers = (existing.covers ?? 0) + covers
    } else {
      byDate.set(date, { revenue: amount, covers })
    }
  }

  for (const [date, entry] of byDate.entries()) {
    rows.push({
      date,
      total_revenue: +entry.revenue.toFixed(2),
      covers:        entry.covers,
    })
  }

  // Trier par date
  rows.sort((a, b) => a.date.localeCompare(b.date))

  return {
    headers,
    autoMap,
    rows,
    rawRows:  result.data.slice(0, 5),
    skipped,
    errors,
  }
}
