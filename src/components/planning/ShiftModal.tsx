'use client'

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, AlertTriangle, CheckCircle2, Euro, CalendarClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import {
  runAllHCRChecks,
  calculateShiftCost,
} from '@/lib/utils/hcr-rules'
import {
  calcHours,
  toISODate,
  extractTime,
} from '@/lib/utils/week-utils'
import { SHIFT_POSITIONS } from '@/types/planning'
import type { ShiftWithEmployee, HCRViolation } from '@/types/planning'
import type { Employee } from '@/types'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  employee_id: z.string().uuid('Employé requis'),
  date:        z.string().min(10, 'Date requise'),      // YYYY-MM-DD
  start_time:  z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  end_time:    z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  position:    z.string().optional(),
  note:        z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────

const inputCls = (e?: boolean) => cn(
  'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
  e ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
)

function formatCurrency(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v)
}

// ── Props ─────────────────────────────────────────────────────

type ShiftModalProps = {
  /** shift = mode édition */
  shift?:            ShiftWithEmployee | null
  /** Données pré-remplies pour la création */
  preDate?:          Date | null
  preEmployee?:      Employee | null
  employees:         Employee[]
  /** Tous les créneaux de la semaine (pour le calcul HCR) */
  weekShifts:        ShiftWithEmployee[]
  onClose:           () => void
  onSaved:           (shift: ShiftWithEmployee) => void
  onDeleted?:        (shiftId: string) => void
}

// ── Composant ─────────────────────────────────────────────────

export function ShiftModal({
  shift, preDate, preEmployee, employees, weekShifts, onClose, onSaved, onDeleted,
}: ShiftModalProps) {
  const [serverError,      setServerError]      = useState<string | null>(null)
  const [violations,       setViolations]       = useState<HCRViolation[]>([])
  const [costBreakdown,    setCostBreakdown]    = useState<ReturnType<typeof calculateShiftCost> | null>(null)
  const [isDeleting,       setIsDeleting]       = useState(false)
  const [showRequestForm,  setShowRequestForm]  = useState(false)
  const [reqStart,         setReqStart]         = useState('')
  const [reqEnd,           setReqEnd]           = useState('')
  const [reqReason,        setReqReason]        = useState('')
  const [reqSubmitting,    setReqSubmitting]    = useState(false)
  const [reqError,         setReqError]         = useState<string | null>(null)
  const [reqSuccess,       setReqSuccess]       = useState(false)
  const isEdit = !!shift?.id

  const defaultDate = shift
    ? toISODate(new Date(shift.start_time))
    : preDate ? toISODate(preDate) : toISODate(new Date())

  const defaultStart = shift ? extractTime(shift.start_time) : '10:00'
  const defaultEnd   = shift ? extractTime(shift.end_time)   : '15:00'

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        employee_id: shift?.employee_id ?? preEmployee?.id ?? (employees[0]?.id ?? ''),
        date:        defaultDate,
        start_time:  defaultStart,
        end_time:    defaultEnd,
        position:    shift?.position ?? '',
        note:        shift?.note ?? '',
      },
    })

  const watchedEmpId  = watch('employee_id')
  const watchedStart  = watch('start_time')
  const watchedEnd    = watch('end_time')
  const watchedDate   = watch('date')

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === watchedEmpId) ?? null,
    [employees, watchedEmpId]
  )

  // ── Calcul HCR + coût en temps réel ──────────────────────

  useEffect(() => {
    if (!selectedEmployee || !watchedStart || !watchedEnd || !watchedDate) {
      setViolations([])
      setCostBreakdown(null)
      return
    }

    // Créneaux de l'employé cette semaine (hors le créneau en cours d'édition)
    const empShifts = weekShifts.filter(
      s => s.employee_id === selectedEmployee.id && s.id !== shift?.id
    )
    const weeklyHours = empShifts.reduce(
      (sum, s) => sum + calcHours(extractTime(s.start_time), extractTime(s.end_time)), 0
    )

    // Créneau précédent le plus proche (pour le repos minimum)
    const shiftStart  = new Date(`${watchedDate}T${watchedStart}:00`)
    const prevShifts  = empShifts.filter(s => new Date(s.end_time) < shiftStart)
    const prevShiftEnd = prevShifts.length > 0
      ? prevShifts.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0].end_time
      : null

    const vs = runAllHCRChecks({
      startTime:    watchedStart,
      endTime:      watchedEnd,
      weeklyHours,
      prevShiftEnd,
      date:         new Date(watchedDate),
    })
    setViolations(vs)

    // Coût du créneau
    const cost = calculateShiftCost(
      selectedEmployee.hourly_rate,
      watchedStart,
      watchedEnd,
      new Date(watchedDate)
    )
    setCostBreakdown(cost)
  }, [selectedEmployee, watchedStart, watchedEnd, watchedDate, weekShifts, shift?.id])

  // ── Soumission ────────────────────────────────────────────

  const onSubmit = async (data: FormData) => {
    setServerError(null)

    // Construire les timestamps ISO
    const startISO = `${data.date}T${data.start_time}:00`
    const endISO   = `${data.date}T${data.end_time}:00`

    const payload = {
      employee_id: data.employee_id,
      start_time:  startISO,
      end_time:    endISO,
      position:    data.position || null,
      note:        data.note     || null,
      status:      'planned',
    }

    try {
      const res = await fetch(
        isEdit ? `/api/shifts/${shift!.id}` : '/api/shifts',
        {
          method:  isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok) { setServerError(json.error ?? 'Erreur.'); return }

      const savedShift = json.shift
      const emp = employees.find(e => e.id === savedShift.employee_id)!
      onSaved({ ...savedShift, employee: emp })
    } catch { setServerError('Erreur réseau.') }
  }

  const handleDelete = async () => {
    if (!shift) return
    setIsDeleting(true)
    const res = await fetch(`/api/shifts/${shift.id}`, { method: 'DELETE' })
    setIsDeleting(false)
    if (res.ok) onDeleted?.(shift.id)
  }

  const handleRequestSubmit = async () => {
    if (!shift || !reqStart || !reqEnd) return
    setReqSubmitting(true)
    setReqError(null)
    try {
      const date = toISODate(new Date(shift.start_time))
      const res = await fetch('/api/shift-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id:        shift.id,
          employee_id:     shift.employee_id,
          type:            'modify',
          requested_start: reqStart,
          requested_end:   reqEnd,
          requested_date:  date,
          reason:          reqReason || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setReqError(json.error ?? 'Erreur.'); return }
      setReqSuccess(true)
    } catch {
      setReqError('Erreur réseau.')
    } finally {
      setReqSubmitting(false)
    }
  }

  const hasErrors   = violations.some(v => v.severity === 'error')
  const hasWarnings = violations.some(v => v.severity === 'warning')

  const footer = (
    <div className="flex items-center gap-3">
      {isEdit && (
        <button type="button" onClick={handleDelete} disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-60 flex items-center gap-2">
          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
          Supprimer
        </button>
      )}
      <div className="flex-1" />
      <button type="button" onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
        Annuler
      </button>
      <button type="submit" form="shift-form" disabled={isSubmitting}
        className={cn(
          'px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 flex items-center gap-2',
          hasErrors ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
        )}>
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? 'Modifier' : 'Créer'}
        {hasErrors && ' (alertes)'}
      </button>
    </div>
  )

  return (
    <Modal title={isEdit ? 'Modifier le créneau' : 'Nouveau créneau'} onClose={onClose} footer={footer}>
      {serverError && (
        <div className="mb-4 flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{serverError}
        </div>
      )}

      <form id="shift-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Employé (uniquement en création sans présélection) */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employé *</label>
            <select {...register('employee_id')} className={inputCls(!!errors.employee_id)}>
              <option value="">— Sélectionner —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} — {e.role}
                </option>
              ))}
            </select>
            {errors.employee_id && <p className="mt-1.5 text-xs text-red-600">{errors.employee_id.message}</p>}
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
          <input type="date" {...register('date')} className={inputCls(!!errors.date)} />
        </div>

        {/* Heures */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Début *</label>
            <input type="time" {...register('start_time')} className={inputCls(!!errors.start_time)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fin *</label>
            <input type="time" {...register('end_time')} className={inputCls(!!errors.end_time)} />
          </div>
        </div>

        {/* Durée affichée */}
        {watchedStart && watchedEnd && (
          <p className="text-xs text-gray-500 -mt-2">
            Durée : <span className="font-semibold">{calcHours(watchedStart, watchedEnd).toFixed(1)} h</span>
          </p>
        )}

        {/* Poste */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Poste</label>
          <select {...register('position')} className={inputCls()}>
            <option value="">— Aucun —</option>
            {SHIFT_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optionnel)</label>
          <input type="text" placeholder="Ex : Remplacement, formation…"
            {...register('note')} className={inputCls()} />
        </div>
      </form>

      {/* ── Alertes HCR ── */}
      {violations.length > 0 && (
        <div className="mt-4 space-y-2">
          {violations.map((v, i) => (
            <div key={i} className={cn(
              'flex items-start gap-2 p-3 rounded-xl text-sm border',
              v.severity === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            )}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{v.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Coût du créneau ── */}
      {costBreakdown && costBreakdown.hours > 0 && (
        <div className={cn(
          'mt-4 rounded-xl p-3 border',
          hasErrors   ? 'bg-red-50 border-red-200'
          : hasWarnings ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Euro className="w-4 h-4" />
              Coût estimé de ce créneau
            </span>
            <span className="text-base font-bold text-gray-900 tabular-nums">
              {formatCurrency(costBreakdown.totalCost)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px] text-gray-500">
            <span>Base : {formatCurrency(costBreakdown.baseCost)}</span>
            {costBreakdown.nightSurcharge  > 0 && <span>Nuit : +{formatCurrency(costBreakdown.nightSurcharge)}</span>}
            {costBreakdown.sundaySurcharge > 0 && <span>Dim : +{formatCurrency(costBreakdown.sundaySurcharge)}</span>}
          </div>
        </div>
      )}

      {/* ── Aucune alerte ── */}
      {violations.length === 0 && costBreakdown && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          Aucune violation HCR détectée
        </div>
      )}

      {/* ── Proposer un changement (mode édition uniquement) ── */}
      {isEdit && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          {!showRequestForm ? (
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(true)
                setReqStart(defaultStart)
                setReqEnd(defaultEnd)
              }}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <CalendarClock className="w-4 h-4" />
              Proposer un changement d&apos;horaire
            </button>
          ) : reqSuccess ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Demande envoyée, en attente de validation.
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-500" />
                Proposer de nouveaux horaires
              </p>

              {reqError && (
                <div className="flex gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{reqError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau début *</label>
                  <input
                    type="time"
                    value={reqStart}
                    onChange={e => setReqStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nouvelle fin *</label>
                  <input
                    type="time"
                    value={reqEnd}
                    onChange={e => setReqEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Raison (optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Ex : contrainte personnelle, formation…"
                  value={reqReason}
                  onChange={e => setReqReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowRequestForm(false); setReqError(null) }}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRequestSubmit}
                  disabled={reqSubmitting || !reqStart || !reqEnd}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {reqSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Envoyer la demande
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
