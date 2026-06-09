// =============================================================
// RestoPilot — Types du module Planning
// =============================================================

import type { Employee, Shift } from '@/types'

// ── Shift enrichi avec l'employé ─────────────────────────────

export type ShiftWithEmployee = Shift & {
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'role' | 'color' | 'hourly_rate' | 'contract_type'>
}

// ── Stats hebdomadaires par employé ──────────────────────────

export type EmployeeWeeklyStats = {
  employee: Employee
  /** Heures planifiées sur la semaine */
  plannedHours:   number
  /** Heures normales (≤ 35h) */
  normalHours:    number
  /** Heures sup 25 % (35–43h) */
  overtime25:     number
  /** Heures sup 50 % (> 43h) */
  overtime50:     number
  /** Heures de nuit (21h–6h) */
  nightHours:     number
  /** Shifts le dimanche */
  sundayHours:    number
  /** Coût estimé de la semaine (€) */
  weeklyCost:     number
}

// ── Stats mensuelles par employé ─────────────────────────────

export type EmployeeMonthlyStats = {
  employee: Employee
  totalHours:     number
  normalHours:    number
  overtime25:     number
  overtime50:     number
  nightHours:     number
  sundayHours:    number
  nightBonus:     number    // € majoration nuit
  sundayBonus:    number    // € majoration dimanche
  overtimeBonus:  number    // € majoration heures sup
  estimatedGross: number    // € total brut estimé
}

// ── Données complètes semaine (réponse API) ───────────────────

export type WeekData = {
  week:        string               // "2026-W23"
  weekDates:   string[]             // ISO dates Mon→Sun
  shifts:      ShiftWithEmployee[]
  employees:   Employee[]
  weeklyStats: EmployeeWeeklyStats[]
  totalCost:   number
  /** CA de la semaine (depuis la table sales) pour calculer le % masse salariale */
  weekRevenue: number | null
}

// ── Résumé mensuel (réponse API) ──────────────────────────────

export type MonthlyPlanningData = {
  month:         string               // "2026-06"
  monthLabel:    string               // "Juin 2026"
  employeeStats: EmployeeMonthlyStats[]
  totalCost:     number
}

// ── Violation HCR ─────────────────────────────────────────────

export type HCRViolation = {
  valid:    boolean
  message:  string
  severity: 'warning' | 'error'
  rule:     string
}

// ── Calcul coût d'un créneau ──────────────────────────────────

export type ShiftCostBreakdown = {
  hours:           number
  baseCost:        number
  nightSurcharge:  number
  sundaySurcharge: number
  totalCost:       number
}

// ── Postes disponibles ────────────────────────────────────────

export const SHIFT_POSITIONS = [
  'Service midi',
  'Service soir',
  'Journée',
  'Extra',
  'Coupure',
  'Ouverture',
  'Fermeture',
] as const

export type ShiftPosition = (typeof SHIFT_POSITIONS)[number]
