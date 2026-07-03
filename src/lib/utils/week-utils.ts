/**
 * week-utils.ts — Utilitaires pour le calcul des semaines ISO.
 * Format de semaine : "2026-W23" (ISO 8601)
 */

// ── Conversion date ↔ semaine ISO ─────────────────────────────

/** Retourne la chaîne de semaine ISO pour une date donnée : "2026-W23" */
export function dateToWeekString(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Aller au jeudi de la semaine (ISO : la semaine contient le jeudi)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86_400_000 + 1) / 7
  )
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/** Retourne le lundi (00:00:00) d'une semaine ISO : "2026-W23" → Date */
export function weekStringToMonday(weekStr: string): Date {
  const parts  = weekStr.split('-W')
  const year   = parseInt(parts[0], 10)
  const week   = parseInt(parts[1], 10)

  // 4 janvier est toujours dans la semaine 1
  const jan4   = new Date(year, 0, 4)
  const day    = jan4.getDay() || 7           // 1=Lun…7=Dim
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Retourne les 7 jours (Lun→Dim) d'une semaine ISO */
export function getWeekDays(weekStr: string): Date[] {
  const monday = weekStringToMonday(weekStr)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

/** Semaine précédente */
export function prevWeek(weekStr: string): string {
  const monday = weekStringToMonday(weekStr)
  monday.setDate(monday.getDate() - 7)
  return dateToWeekString(monday)
}

/** Semaine suivante */
export function nextWeek(weekStr: string): string {
  const monday = weekStringToMonday(weekStr)
  monday.setDate(monday.getDate() + 7)
  return dateToWeekString(monday)
}

/** Semaine en cours */
export function getCurrentWeek(): string {
  return dateToWeekString(new Date())
}

// ── Formatage et affichage ────────────────────────────────────

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_NAMES_LONG  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/** "Lun 15 juin" */
export function formatDayLabel(date: Date, short = true): string {
  const names = short ? DAY_NAMES_SHORT : DAY_NAMES_LONG
  // L'index ISO : 0=Lun…6=Dim  (date.getDay() donne 0=Dim)
  const idx = (date.getDay() + 6) % 7
  return `${names[idx]} ${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'short' })}`
}

/** "Semaine 23 · 2 – 8 juin 2026" */
export function formatWeekLabel(weekStr: string): string {
  const days = getWeekDays(weekStr)
  const mon = days[0]
  const sun = days[6]
  const [year, wNum] = weekStr.split('-W')
  const same_month   = mon.getMonth() === sun.getMonth()
  const from = mon.toLocaleDateString('fr-FR', { day: 'numeric', month: same_month ? undefined : 'long' })
  const to   = sun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `Semaine ${wNum} · ${from}–${to}`
}

/** Retourne la date ISO "YYYY-MM-DD" d'un objet Date (composants locaux, pas UTC) */
export function toISODate(date: Date): string {
  const year  = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day   = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Extrait l'heure "HH:MM" d'un timestamp ISO */
export function extractTime(isoTimestamp: string): string {
  return isoTimestamp.slice(11, 16)
}

/** Formate une heure "HH:MM" en "10h30" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  return m === '00' ? `${parseInt(h)}h` : `${parseInt(h)}h${m}`
}

/** Calcule la durée en heures entre deux heures "HH:MM" */
export function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60   // créneau de nuit
  return minutes / 60
}

/** Retourne le label d'un mois ISO "2026-06" → "Juin 2026" */
export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year:  'numeric',
  })
}
