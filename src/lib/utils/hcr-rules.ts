/**
 * hcr-rules.ts — Règles de la Convention Collective Hôtels-Cafés-Restaurants (HCR).
 * Chaque règle retourne { valid, message, severity, rule }.
 */

import type { HCRViolation, ShiftCostBreakdown } from '@/types/planning'
import { calcHours } from './week-utils'

// ── Constantes légales HCR ────────────────────────────────────

export const HCR = {
  MIN_REST_HOURS:       11,      // Repos minimum entre deux services (h)
  MAX_AMPLITUDE_HOURS: 11.5,    // Amplitude maximale d'un service (h)
  WEEKLY_NORMAL_HOURS: 35,      // Heures normales par semaine
  OT_THRESHOLD_1:      43,      // Seuil heures sup 25 % → 50 %
  OT_RATE_1:           1.25,    // Majoration 35–43h
  OT_RATE_2:           1.50,    // Majoration >43h
  NIGHT_SURCHARGE:     0.10,    // Majoration nuit (10 %)
  SUNDAY_SURCHARGE:    0.10,    // Majoration dimanche (10 %)
  NIGHT_START:         21,      // Début plage nuit (21h)
  NIGHT_END:           6,       // Fin plage nuit (6h)
} as const

// ── Règles unitaires ──────────────────────────────────────────

/**
 * Vérifie le repos minimum entre deux services (11h HCR).
 * @param prevEndISO  Fin du service précédent (ISO timestamp ou null)
 * @param newStartISO Début du nouveau service (ISO timestamp)
 */
export function checkRestBetweenShifts(
  prevEndISO: string | null,
  newStartISO: string
): HCRViolation {
  if (!prevEndISO) return ok('rest')

  const restHours =
    (new Date(newStartISO).getTime() - new Date(prevEndISO).getTime()) / 3_600_000

  if (restHours < HCR.MIN_REST_HOURS) {
    return {
      valid:    false,
      message:  `Repos insuffisant : ${restHours.toFixed(1)}h entre deux services (minimum légal : 11h)`,
      severity: 'error',
      rule:     'rest',
    }
  }
  return ok('rest')
}

/**
 * Vérifie que l'amplitude horaire du service ne dépasse pas 11h30.
 * @param startTime "HH:MM"
 * @param endTime   "HH:MM"
 */
export function checkAmplitude(
  startTime: string,
  endTime:   string
): HCRViolation {
  const hours = calcHours(startTime, endTime)
  if (hours > HCR.MAX_AMPLITUDE_HOURS) {
    return {
      valid:    false,
      message:  `Amplitude trop élevée : ${hours.toFixed(1)}h (max. 11h30 par service)`,
      severity: 'error',
      rule:     'amplitude',
    }
  }
  if (hours > 10) {
    return {
      valid:    false,
      message:  `Amplitude de ${hours.toFixed(1)}h — service long, vérifier avec le salarié`,
      severity: 'warning',
      rule:     'amplitude',
    }
  }
  return ok('amplitude')
}

/**
 * Vérifie les heures hebdomadaires et calcule les heures supplémentaires.
 * @param currentHours Heures déjà planifiées cette semaine
 * @param newHours     Heures du nouveau service
 */
export function checkWeeklyHours(
  currentHours: number,
  newHours:     number
): HCRViolation {
  const total = currentHours + newHours

  if (total > HCR.OT_THRESHOLD_1) {
    return {
      valid:    false,
      message:  `${total.toFixed(1)}h cette semaine — majoration +50 % au-delà de 43h`,
      severity: 'error',
      rule:     'weekly_hours',
    }
  }
  if (total > HCR.WEEKLY_NORMAL_HOURS) {
    const ot = total - HCR.WEEKLY_NORMAL_HOURS
    return {
      valid:    false,
      message:  `${ot.toFixed(1)}h supplémentaires (total semaine : ${total.toFixed(1)}h) — majoration 25 %`,
      severity: 'warning',
      rule:     'weekly_hours',
    }
  }
  return ok('weekly_hours')
}

// ── Calcul des majorations et du coût ────────────────────────

/**
 * Calcule les heures de nuit (21h–6h) pour un service donné.
 * Gère les créneaux nocturnes qui passent minuit.
 */
export function calcNightHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)

  const startMin = sh * 60 + sm
  let   endMin   = eh * 60 + em

  if (endMin < startMin) endMin += 24 * 60  // service de nuit (passe minuit)

  const NIGHT_START = HCR.NIGHT_START * 60       // 21h en minutes
  const NIGHT_END   = HCR.NIGHT_END   * 60       // 6h  en minutes
  const MID_NIGHT   = 24 * 60

  let nightMinutes = 0

  // Segment du soir : 21h–minuit
  const eveningFrom = Math.max(startMin, NIGHT_START)
  const eveningTo   = Math.min(endMin, MID_NIGHT)
  if (eveningFrom < eveningTo) nightMinutes += eveningTo - eveningFrom

  // Segment du matin : minuit–6h (pour les shifts qui passent minuit)
  if (endMin > MID_NIGHT) {
    const morningFrom = Math.max(startMin, MID_NIGHT) - MID_NIGHT  // remis à 0
    const morningTo   = Math.min(endMin - MID_NIGHT, NIGHT_END)
    if (morningFrom < morningTo) nightMinutes += morningTo - morningFrom
  } else {
    // Shift qui commence après minuit (0h–6h)
    const earlyFrom = Math.max(startMin, 0)
    const earlyTo   = Math.min(endMin, NIGHT_END)
    if (earlyFrom < earlyTo) nightMinutes += earlyTo - earlyFrom
  }

  return nightMinutes / 60
}

/**
 * Calcule le coût complet d'un créneau (base + majorations nuit/dimanche).
 * Les heures supplémentaires hebdomadaires sont calculées séparément (niveau semaine).
 */
export function calculateShiftCost(
  hourlyRate: number,
  startTime:  string,   // "HH:MM"
  endTime:    string,   // "HH:MM"
  date:       Date
): ShiftCostBreakdown {
  const hours      = calcHours(startTime, endTime)
  const nightHours = calcNightHours(startTime, endTime)
  const isSunday   = date.getDay() === 0

  const baseCost        = hours * hourlyRate
  const nightSurcharge  = nightHours * hourlyRate * HCR.NIGHT_SURCHARGE
  const sundaySurcharge = isSunday ? baseCost * HCR.SUNDAY_SURCHARGE : 0
  const totalCost       = baseCost + nightSurcharge + sundaySurcharge

  return {
    hours:           +hours.toFixed(4),
    baseCost:        +baseCost.toFixed(2),
    nightSurcharge:  +nightSurcharge.toFixed(2),
    sundaySurcharge: +sundaySurcharge.toFixed(2),
    totalCost:       +totalCost.toFixed(2),
  }
}

/**
 * Calcule le coût hebdomadaire total en tenant compte des heures sup.
 */
export function calculateWeeklyCost(
  hourlyRate:   number,
  normalHours:  number,
  overtime25:   number,
  overtime50:   number,
  nightBonus:   number,
  sundayBonus:  number
): number {
  const normalCost    = normalHours  * hourlyRate
  const ot25Cost      = overtime25   * hourlyRate * (HCR.OT_RATE_1 - 1)  // supplément
  const ot50Cost      = overtime50   * hourlyRate * (HCR.OT_RATE_2 - 1)
  return +(normalCost + ot25Cost + ot50Cost + nightBonus + sundayBonus).toFixed(2)
}

/**
 * Exécute toutes les règles HCR pour un créneau donné.
 * @param params
 */
export function runAllHCRChecks(params: {
  startTime:     string
  endTime:       string
  weeklyHours:   number
  prevShiftEnd:  string | null
  date:          Date
}): HCRViolation[] {
  const newHours   = calcHours(params.startTime, params.endTime)
  const violations = [
    checkAmplitude(params.startTime, params.endTime),
    checkWeeklyHours(params.weeklyHours, newHours),
    checkRestBetweenShifts(params.prevShiftEnd, `${params.date.toISOString().split('T')[0]}T${params.startTime}:00`),
  ]
  return violations.filter(v => !v.valid)
}

// ── Helper interne ────────────────────────────────────────────

function ok(rule: string): HCRViolation {
  return { valid: true, message: '', severity: 'warning', rule }
}
