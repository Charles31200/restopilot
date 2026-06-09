// =============================================================
// RestoPilot — Types du module Comptabilité
// =============================================================

// ── Données financières mensuelles ───────────────────────────

export type WeeklyBreakdown = {
  weekLabel:      string   // "S1", "S2"…
  fromDate:       string   // ISO date lundi
  toDate:         string   // ISO date dimanche
  revenue:        number   // CA (€)
  purchases:      number   // Achats fournisseurs (€)
  laborCost:      number   // Masse salariale (€)
  grossMargin:    number   // Marge brute (€)
  grossMarginPct: number   // %
}

export type MonthlyFinancials = {
  month:          string   // "2026-06"
  monthLabel:     string   // "Juin 2026"
  revenue:        number
  purchases:      number
  laborCost:      number
  grossMargin:    number
  grossMarginPct: number
  laborPct:       number   // masse salariale / CA %
  purchasesPct:   number   // achats / CA %
  weeklyBreakdown: WeeklyBreakdown[]
}

// ── OCR Factures ─────────────────────────────────────────────

export type OCRResult = {
  supplier_name:  string
  invoice_date:   string        // YYYY-MM-DD
  amount_ht:      number
  vat_amount:     number
  due_date:       string | null
  /** Message d'erreur si l'OCR a échoué */
  error?:         string
}

// ── Rapport hebdomadaire ──────────────────────────────────────

export type WeeklyReportData = {
  week:           string    // "2026-W23"
  weekLabel:      string    // "Semaine 23 · 2–8 juin 2026"
  revenue:        number
  purchases:      number
  laborCost:      number
  grossMargin:    number
  grossMarginPct: number
  alerts:         string[]
  emailSent?:     boolean
}

// ── FEC ───────────────────────────────────────────────────────

export type FECLine = {
  JournalCode:   string
  JournalLib:    string
  EcritureNum:   string
  EcritureDate:  string   // YYYYMMDD
  CompteNum:     string
  CompteLib:     string
  PieceRef:      string
  PieceDate:     string
  EcritureLib:   string
  Debit:         string
  Credit:        string
  EcritureLet:   string
  DateLet:       string
  ValidDate:     string
  Montantdevise: string
  Idevise:       string
}

// ── Facture étendue (avec total TTC calculé) ─────────────────

export type InvoiceExtended = {
  id:            string
  restaurant_id: string
  supplier_name: string | null
  /** Montant HT */
  amount:        number
  vat_amount:    number
  /** Calculé : amount + vat_amount */
  total_ttc:     number
  invoice_date:  string | null
  due_date:      string | null
  file_url:      string | null
  status:        'pending' | 'validated' | 'paid'
  ocr_raw_text:  string | null
  created_at:    string
}
