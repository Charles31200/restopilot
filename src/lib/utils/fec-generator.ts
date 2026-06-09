/**
 * fec-generator.ts — Générateur de Fichier des Écritures Comptables (FEC)
 * Format officiel DGFiP (art. L13 AA du LPF).
 *
 * Structure : 16 colonnes séparées par | (pipe)
 * Journaux utilisés :
 *   VE — VENTES     : écritures de ventes journalières
 *   AC — ACHATS     : écritures des factures fournisseurs
 */

// ── Types d'entrée ────────────────────────────────────────────

export type FECSaleInput = {
  id:            string
  date:          string   // YYYY-MM-DD
  total_revenue: number
}

export type FECInvoiceInput = {
  id:           string
  invoice_date: string | null
  supplier_name: string | null
  amount:       number   // HT
  vat_amount:   number
}

// ── Formatage ─────────────────────────────────────────────────

/** Convertit un montant en format FEC français (comma, 2 décimales) */
function fecAmount(n: number): string {
  return Math.abs(n).toFixed(2).replace('.', ',')
}

/** Convertit une date ISO en format FEC (YYYYMMDD) */
function fecDate(isoDate: string): string {
  return isoDate.replace(/-/g, '')
}

/** Numéro d'écriture à 6 chiffres */
function ecritureNum(n: number): string {
  return String(n).padStart(6, '0')
}

const HEADER =
  'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|' +
  'PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'

/** Fabrique une ligne FEC */
function line(fields: {
  journalCode:   string
  journalLib:    string
  num:           number
  date:          string
  compteNum:     string
  compteLib:     string
  pieceRef:      string
  pieceDate:     string
  libelle:       string
  debit:         number
  credit:        number
  montant:       number
}): string {
  return [
    fields.journalCode,
    fields.journalLib,
    ecritureNum(fields.num),
    fecDate(fields.date),
    fields.compteNum,
    fields.compteLib,
    fields.pieceRef,
    fecDate(fields.pieceDate),
    fields.libelle,
    fecAmount(fields.debit),
    fecAmount(fields.credit),
    '',   // EcritureLet
    '',   // DateLet
    '',   // ValidDate
    fecAmount(fields.montant),
    'EUR',
  ].join('|')
}

// ── Générateur principal ──────────────────────────────────────

/**
 * Génère le contenu FEC complet pour un mois.
 * @param sales    Ventes journalières
 * @param invoices Factures fournisseurs
 * @param month    "2026-06"
 */
export function generateFEC(
  sales:    FECSaleInput[],
  invoices: FECInvoiceInput[],
  month:    string
): string {
  const lines: string[] = [HEADER]
  let num = 1

  // ── Journal VENTES ────────────────────────────────────────
  // Pour chaque journée, on regroupe les ventes
  const salesByDate = new Map<string, number>()
  for (const s of sales) {
    salesByDate.set(s.date, (salesByDate.get(s.date) ?? 0) + s.total_revenue)
  }

  for (const [date, revenue] of [...salesByDate.entries()].sort()) {
    const ref  = `VTE-${date.replace(/-/g, '')}`
    const lib  = `Vente du ${date}`
    const base = { journalCode: 'VE', journalLib: 'VENTES', num, date, pieceRef: ref, pieceDate: date }

    // Débit 411 Clients
    lines.push(line({ ...base, compteNum: '411000', compteLib: 'CLIENTS', libelle: lib, debit: revenue, credit: 0, montant: revenue }))
    // Crédit 707 Ventes
    lines.push(line({ ...base, compteNum: '707000', compteLib: 'VENTES DE MARCHANDISES', libelle: lib, debit: 0, credit: revenue, montant: revenue }))
    num++
  }

  // ── Journal ACHATS ────────────────────────────────────────
  for (const inv of invoices) {
    if (!inv.invoice_date) continue

    const date     = inv.invoice_date
    const supplier = (inv.supplier_name ?? 'FOURNISSEUR').toUpperCase().substring(0, 30)
    const ref      = `FAC-${date.replace(/-/g, '')}-${inv.id.slice(0, 6).toUpperCase()}`
    const lib      = `Achat ${supplier}`
    const amountHT = inv.amount
    const vat      = inv.vat_amount
    const totalTTC = amountHT + vat
    const base     = { journalCode: 'AC', journalLib: 'ACHATS', num, date, pieceRef: ref, pieceDate: date }

    // Débit 607 Achats marchandises
    lines.push(line({ ...base, compteNum: '607000', compteLib: 'ACHATS NON STOCKES', libelle: lib, debit: amountHT, credit: 0, montant: amountHT }))

    // Débit 445660 TVA déductible (si > 0)
    if (vat > 0) {
      lines.push(line({ ...base, compteNum: '445660', compteLib: 'TVA DEDUCTIBLE', libelle: `TVA ${supplier}`, debit: vat, credit: 0, montant: vat }))
    }

    // Crédit 401 Fournisseurs
    lines.push(line({ ...base, compteNum: '401000', compteLib: 'FOURNISSEURS', libelle: lib, debit: 0, credit: totalTTC, montant: totalTTC }))
    num++
  }

  return lines.join('\r\n')
}

/** Génère le nom de fichier FEC officiel */
export function fecFilename(siren: string | null, month: string): string {
  const s = (siren ?? '000000000').replace(/\s/g, '').padStart(9, '0')
  const [year, mo] = month.split('-')
  const lastDay = new Date(parseInt(year), parseInt(mo), 0)
  const end = `${year}${mo}${String(lastDay.getDate()).padStart(2, '0')}`
  return `${s}FEC${end}.txt`
}
