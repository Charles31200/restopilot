'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CalendarDays, Users,
  BarChart2, FileDown, UserPlus, Loader2, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  prevWeek, nextWeek, getCurrentWeek,
  formatWeekLabel, getWeekDays,
} from '@/lib/utils/week-utils'
import { PlanningGrid }   from '@/components/planning/PlanningGrid'
import { ShiftModal }     from '@/components/planning/ShiftModal'
import { EmployeeModal }  from '@/components/planning/EmployeeModal'
import { WeeklySummary }  from '@/components/planning/WeeklySummary'
import { MonthlyExport }  from '@/components/planning/MonthlyExport'
import type { WeekData, ShiftWithEmployee } from '@/types/planning'
import type { Employee } from '@/types'

// ── Types modaux ──────────────────────────────────────────────

type ModalState =
  | { type: 'shift_create'; employee: Employee; date: Date }
  | { type: 'shift_edit';   shift: ShiftWithEmployee }
  | { type: 'employee_create' }
  | { type: 'employee_edit'; employee: Employee }
  | { type: 'summary' }
  | { type: 'export' }
  | null

// ── Props ─────────────────────────────────────────────────────

type PlanningClientProps = {
  initialData: WeekData | null
  initialWeek: string
}

// ── Composant ─────────────────────────────────────────────────

export function PlanningClient({ initialData, initialWeek }: PlanningClientProps) {
  const router = useRouter()

  const [currentWeek, setCurrentWeek] = useState(initialWeek)
  const [weekData,    setWeekData]    = useState<WeekData | null>(initialData)
  const [isLoading,   setIsLoading]   = useState(false)
  const [modal,       setModal]       = useState<ModalState>(null)

  const weekDays = getWeekDays(currentWeek)
  const isCurrentWeek = currentWeek === getCurrentWeek()

  // ── Fetch semaine ────────────────────────────────────────

  const fetchWeek = useCallback(async (week: string) => {
    setIsLoading(true)
    try {
      const res  = await fetch(`/api/shifts?week=${week}`)
      if (!res.ok) throw new Error()
      const data: WeekData = await res.json()
      setWeekData(data)
    } catch {
      // Garder les données précédentes
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Navigation semaine ───────────────────────────────────

  const navigate = (dir: 'prev' | 'next') => {
    const newWeek = dir === 'prev' ? prevWeek(currentWeek) : nextWeek(currentWeek)
    setCurrentWeek(newWeek)
    router.push(`/dashboard/planning?week=${newWeek}`, { scroll: false })
    fetchWeek(newWeek)
  }

  const goToCurrentWeek = () => {
    const cw = getCurrentWeek()
    setCurrentWeek(cw)
    router.push(`/dashboard/planning?week=${cw}`, { scroll: false })
    fetchWeek(cw)
  }

  // Fetch initial si pas de données
  useEffect(() => {
    if (!initialData) fetchWeek(initialWeek)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Callbacks après mutations ────────────────────────────

  const handleShiftSaved = useCallback((saved: ShiftWithEmployee) => {
    setWeekData(prev => {
      if (!prev) return prev
      const exists = prev.shifts.findIndex(s => s.id === saved.id)
      const shifts = exists >= 0
        ? prev.shifts.map(s => s.id === saved.id ? saved : s)
        : [...prev.shifts, saved]
      return { ...prev, shifts }
    })
    setModal(null)
  }, [])

  const handleShiftDeleted = useCallback((shiftId: string) => {
    setWeekData(prev => prev
      ? { ...prev, shifts: prev.shifts.filter(s => s.id !== shiftId) }
      : prev
    )
    setModal(null)
  }, [])

  const handleEmployeeSaved = useCallback((emp: Employee) => {
    setWeekData(prev => {
      if (!prev) return prev
      const exists = prev.employees.findIndex(e => e.id === emp.id)
      const employees = exists >= 0
        ? prev.employees.map(e => e.id === emp.id ? emp : e)
        : [...prev.employees, emp]
      return { ...prev, employees }
    })
    setModal(null)
  }, [])

  // ── Données dérivées ─────────────────────────────────────

  const shifts    = weekData?.shifts    ?? []
  const employees = weekData?.employees ?? []

  // Compte les alertes (shifts avec violations HCR potentielles)
  const criticalCount = weekData?.weeklyStats.filter(s => s.overtime25 + s.overtime50 > 0).length ?? 0

  return (
    <div className="space-y-4">
      {/* ── Barre d'outils ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Navigation semaine */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-1 py-1">
          <button
            onClick={() => navigate('prev')}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-medium text-gray-700 px-1 min-w-0 text-center whitespace-nowrap">
            {formatWeekLabel(currentWeek)}
          </span>

          <button
            onClick={() => navigate('next')}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Retour à aujourd'hui */}
        {!isCurrentWeek && (
          <button
            onClick={goToCurrentWeek}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Aujourd'hui
          </button>
        )}

        {/* Rafraîchir */}
        <button
          onClick={() => fetchWeek(currentWeek)}
          disabled={isLoading}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          aria-label="Rafraîchir"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>

        <div className="flex-1" />

        {/* Récap semaine */}
        <button
          onClick={() => setModal({ type: 'summary' })}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-xl transition-colors',
            criticalCount > 0
              ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <BarChart2 className="w-4 h-4" />
          Récap
          {criticalCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Export mensuel */}
        <button
          onClick={() => setModal({ type: 'export' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>

        {/* Nouvel employé */}
        <button
          onClick={() => setModal({ type: 'employee_create' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Employé
        </button>
      </div>

      {/* ── Grille planning ── */}
      {isLoading && !weekData ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
        </div>
      ) : (
        <PlanningGrid
          weekDays={weekDays}
          employees={employees}
          shifts={shifts}
          weeklyStats={weekData?.weeklyStats}
          isLoading={isLoading}
          onCellClick={(employee, date) => setModal({ type: 'shift_create', employee, date })}
          onShiftClick={(shift) => setModal({ type: 'shift_edit', shift })}
        />
      )}

      {/* ── Liste employés (collapsée sous la grille) ── */}
      {employees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setModal({ type: 'employee_edit', employee: emp })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: emp.color }} />
              {emp.first_name} {emp.last_name}
            </button>
          ))}
          <button
            onClick={() => setModal({ type: 'employee_create' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            Ajouter
          </button>
        </div>
      )}

      {/* ── Modaux ── */}

      {modal?.type === 'shift_create' && (
        <ShiftModal
          preDate={modal.date}
          preEmployee={modal.employee}
          employees={employees}
          weekShifts={shifts}
          onClose={() => setModal(null)}
          onSaved={handleShiftSaved}
        />
      )}

      {modal?.type === 'shift_edit' && (
        <ShiftModal
          shift={modal.shift}
          employees={employees}
          weekShifts={shifts}
          onClose={() => setModal(null)}
          onSaved={handleShiftSaved}
          onDeleted={handleShiftDeleted}
        />
      )}

      {(modal?.type === 'employee_create' || modal?.type === 'employee_edit') && (
        <EmployeeModal
          employee={modal.type === 'employee_edit' ? modal.employee : null}
          onClose={() => setModal(null)}
          onSaved={handleEmployeeSaved}
        />
      )}

      {modal?.type === 'summary' && weekData && (
        <WeeklySummary
          weeklyStats={weekData.weeklyStats}
          totalCost={weekData.totalCost}
          weekRevenue={weekData.weekRevenue}
          weekLabel={formatWeekLabel(currentWeek)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'export' && (
        <MonthlyExport onClose={() => setModal(null)} />
      )}
    </div>
  )
}
