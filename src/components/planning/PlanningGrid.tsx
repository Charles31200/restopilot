'use client'

import { useMemo } from 'react'
import { Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDayLabel, extractTime, formatTime, toISODate } from '@/lib/utils/week-utils'
import type { ShiftWithEmployee, EmployeeWeeklyStats } from '@/types/planning'
import type { Employee } from '@/types'

// ── Couleurs par rôle ─────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  cuisinier: '#F97316', // orange  — cuisine
  serveur:   '#3B82F6', // blue    — salle
  barman:    '#8B5CF6', // purple  — bar
  plongeur:  '#64748B', // slate   — plonge
  manager:   '#10B981', // emerald — management
  autre:     '#9CA3AF', // gray
}

function getRoleColor(role: string): string {
  return ROLE_COLORS[role] ?? '#6B7280'
}

// ── Helpers ───────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function fmtH(h: number): string {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return min > 0 ? `${hrs}h${String(min).padStart(2, '0')}` : `${hrs}h`
}

// ── Sous-composant : badge de créneau ─────────────────────────

function ShiftBadge({
  shift,
  onClick,
}: {
  shift:   ShiftWithEmployee
  onClick: () => void
}) {
  const color  = getRoleColor(shift.employee.role)
  const startT = formatTime(extractTime(shift.start_time))
  const endT   = formatTime(extractTime(shift.end_time))

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick() }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="rounded-lg border-l-[3px] px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity text-left"
      style={{
        backgroundColor: hexToRgba(color, 0.12),
        borderLeftColor: color,
      }}
    >
      <p className="text-xs font-semibold text-gray-800 leading-tight whitespace-nowrap">
        {startT}–{endT}
      </p>
      {shift.position && (
        <p className="text-[10px] text-gray-500 truncate mt-0.5">{shift.position}</p>
      )}
    </div>
  )
}

// ── Sous-composant : cellule vide ─────────────────────────────

function EmptyCell({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="h-full min-h-[60px] flex items-center justify-center rounded-lg border border-dashed border-transparent hover:border-gray-300 hover:bg-gray-50 cursor-pointer group transition-all"
    >
      <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────

type PlanningGridProps = {
  weekDays:      Date[]
  employees:     Employee[]
  shifts:        ShiftWithEmployee[]
  weeklyStats?:  EmployeeWeeklyStats[]
  isLoading?:    boolean
  onCellClick:   (employee: Employee, date: Date) => void
  onShiftClick:  (shift: ShiftWithEmployee) => void
}

// ── Composant ─────────────────────────────────────────────────

export function PlanningGrid({
  weekDays,
  employees,
  shifts,
  weeklyStats,
  isLoading,
  onCellClick,
  onShiftClick,
}: PlanningGridProps) {
  const today = toISODate(new Date())

  const shiftIndex = useMemo(() => {
    const map = new Map<string, ShiftWithEmployee[]>()
    for (const shift of shifts) {
      const dateStr = toISODate(new Date(shift.start_time))
      const key     = `${shift.employee_id}_${dateStr}`
      const prev    = map.get(key) ?? []
      prev.push(shift)
      map.set(key, prev)
    }
    return map
  }, [shifts])

  const headcountByDay = useMemo(() =>
    weekDays.map(day => {
      const dateStr = toISODate(day)
      return new Set(
        shifts
          .filter(s => toISODate(new Date(s.start_time)) === dateStr)
          .map(s => s.employee_id)
      ).size
    }),
    [weekDays, shifts]
  )

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center gap-3">
        <p className="text-gray-400 text-sm">Aucun employé. Commencez par en ajouter un.</p>
      </div>
    )
  }

  return (
    <div className={cn(isLoading && 'opacity-60 pointer-events-none')}>

      {/* ── Vue liste mobile (< md) ── */}
      <div className="md:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {employees.map(emp => {
          const empShifts = shifts.filter(s => s.employee_id === emp.id)
          const stats     = weeklyStats?.find(s => s.employee.id === emp.id)
          const roleColor = getRoleColor(emp.role)

          return (
            <div key={emp.id}>
              {/* En-tête employé */}
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ borderLeft: `3px solid ${roleColor}` }}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[10px] text-gray-400">{emp.role}</p>
                </div>
                {stats && stats.plannedHours > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {fmtH(stats.plannedHours)}
                  </span>
                )}
              </div>

              {/* Shifts de la semaine */}
              <div className="px-4 pb-2 space-y-1">
                {weekDays.map(day => {
                  const dateStr  = toISODate(day)
                  const isToday  = dateStr === today
                  const dayLabel = formatDayLabel(day, true)
                  const dayShifts = empShifts.filter(
                    s => toISODate(new Date(s.start_time)) === dateStr
                  )

                  if (dayShifts.length === 0) return null

                  return (
                    <div key={dateStr} className="flex items-start gap-2 py-1">
                      <span className={cn(
                        'text-[11px] font-medium w-20 flex-shrink-0 pt-0.5',
                        isToday ? 'text-blue-600' : 'text-gray-400'
                      )}>
                        {dayLabel.split(' ').slice(0, 2).join(' ')}
                      </span>
                      <div className="space-y-1 flex-1">
                        {dayShifts.map(s => {
                          const color = getRoleColor(s.employee.role)
                          return (
                            <button
                              key={s.id}
                              onClick={() => onShiftClick(s)}
                              className="w-full text-left rounded-lg px-2 py-1.5 text-xs border-l-[2px]"
                              style={{
                                backgroundColor: hexToRgba(color, 0.1),
                                borderLeftColor: color,
                              }}
                            >
                              <span className="font-semibold text-gray-800">
                                {formatTime(extractTime(s.start_time))}–{formatTime(extractTime(s.end_time))}
                              </span>
                              {s.position && (
                                <span className="text-gray-400 ml-1.5">{s.position}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Bouton ajouter un créneau */}
                <button
                  onClick={() => onCellClick(emp, new Date())}
                  className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter un créneau
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Grille desktop (≥ md) ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: '720px' }}>
            {/* En-tête colonnes */}
            <div className="grid border-b border-gray-200"
              style={{ gridTemplateColumns: '190px repeat(7, 1fr)' }}>
              <div className="px-4 py-3 bg-gray-50 border-r border-gray-200">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Équipe</span>
              </div>
              {weekDays.map((day, idx) => {
                const dateStr  = toISODate(day)
                const isToday  = dateStr === today
                const isSunday = day.getDay() === 0

                return (
                  <div
                    key={idx}
                    className={cn(
                      'px-2 py-3 text-center border-r border-gray-200 last:border-r-0',
                      isToday   ? 'bg-blue-50'
                      : isSunday ? 'bg-amber-50/50'
                      : 'bg-gray-50'
                    )}
                  >
                    <p className={cn(
                      'text-xs font-semibold uppercase tracking-wide',
                      isToday ? 'text-blue-600' : isSunday ? 'text-amber-600' : 'text-gray-500'
                    )}>
                      {formatDayLabel(day, true).split(' ')[0]}
                    </p>
                    <p className={cn(
                      'text-base font-bold leading-tight',
                      isToday ? 'text-blue-700' : 'text-gray-800'
                    )}>
                      {day.getDate()}
                    </p>
                    {headcountByDay[idx] > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{headcountByDay[idx]} pers.</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Lignes employés */}
            {employees.map((emp, empIdx) => {
              const stats     = weeklyStats?.find(s => s.employee.id === emp.id)
              const roleColor = getRoleColor(emp.role)

              return (
                <div
                  key={emp.id}
                  className={cn(
                    'grid border-b border-gray-100 last:border-b-0',
                    empIdx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'
                  )}
                  style={{ gridTemplateColumns: '190px repeat(7, 1fr)' }}
                >
                  {/* Colonne employé */}
                  <div className="px-4 py-3 flex items-center gap-2.5 border-r border-gray-200 sticky left-0 z-10 bg-inherit">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: roleColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-gray-400 truncate">{emp.role}</p>
                        {stats && stats.plannedHours > 0 && (
                          <span className="text-[10px] text-gray-500 tabular-nums font-medium">
                            · {fmtH(stats.plannedHours)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cellules jours */}
                  {weekDays.map((day, dayIdx) => {
                    const dateStr    = toISODate(day)
                    const isSunday   = day.getDay() === 0
                    const isToday    = dateStr === today
                    const cellShifts = shiftIndex.get(`${emp.id}_${dateStr}`) ?? []

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          'p-1.5 border-r border-gray-100 last:border-r-0 min-h-[72px]',
                          isToday   ? 'bg-blue-50/30'
                          : isSunday ? 'bg-amber-50/20'
                          : ''
                        )}
                      >
                        {cellShifts.length > 0 ? (
                          <div className="space-y-1">
                            {cellShifts.map(s => (
                              <ShiftBadge
                                key={s.id}
                                shift={s}
                                onClick={() => onShiftClick(s)}
                              />
                            ))}
                            <div
                              onClick={() => onCellClick(emp, day)}
                              className="flex items-center justify-center h-5 rounded opacity-0 hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                        ) : (
                          <EmptyCell onClick={() => onCellClick(emp, day)} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
