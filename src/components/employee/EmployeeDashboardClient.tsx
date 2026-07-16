'use client'

import { useEffect, useState } from 'react'
import { Loader2, CalendarDays, Clock3, MessageSquareDiff, Send, Timer, LogIn, LogOut } from 'lucide-react'
import { getCurrentWeek, formatDayLabel, extractTime, formatTime, toISODate } from '@/lib/utils/week-utils'
import type { WeekData } from '@/types/planning'
import type { ShiftRequest } from '@/types'

type MyShift = WeekData['shifts'][number]

type TimeLog = {
  id:        string
  shift_id:  string | null
  clock_in:  string | null
  clock_out: string | null
  created_at: string
}

function formatElapsed(startISO: string, endISO?: string): string {
  const start = new Date(startISO).getTime()
  const end   = endISO ? new Date(endISO).getTime() : Date.now()
  const totalMinutes = Math.max(0, Math.round((end - start) / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')}` : `${m} min`
}

export function EmployeeDashboardClient({ employeeId }: { employeeId: string }) {
  const [weekData,  setWeekData]  = useState<WeekData | null>(null)
  const [requests,  setRequests]  = useState<ShiftRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Pointeuse ───────────────────────────────────────────────
  const [timeLog,      setTimeLog]      = useState<TimeLog | null>(null)
  const [clockLoading, setClockLoading] = useState(false)
  const [clockError,   setClockError]   = useState<string | null>(null)

  // ── État du formulaire de demande (un seul ouvert à la fois) ──
  const [openShiftId, setOpenShiftId] = useState<string | null>(null)
  const [reqStart,    setReqStart]    = useState('')
  const [reqEnd,      setReqEnd]      = useState('')
  const [reqReason,   setReqReason]   = useState('')
  const [reqSubmitting, setReqSubmitting] = useState(false)
  const [reqError,      setReqError]      = useState<string | null>(null)

  async function load() {
    setIsLoading(true)
    try {
      const week = getCurrentWeek()
      const [shiftsRes, requestsRes, timeLogRes] = await Promise.all([
        fetch(`/api/shifts?week=${week}`),
        fetch('/api/shift-requests'),
        fetch('/api/time-logs'),
      ])
      const shiftsJson   = shiftsRes.ok   ? await shiftsRes.json()   : null
      const requestsJson = requestsRes.ok ? await requestsRes.json() : null
      const timeLogJson  = timeLogRes.ok  ? await timeLogRes.json()  : null
      if (shiftsJson)   setWeekData(shiftsJson)
      if (requestsJson) setRequests(requestsJson.requests ?? [])
      if (timeLogJson)  setTimeLog(timeLogJson.log ?? null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (isLoading) {
    return (
      <div
        className="rounded-[20px] p-12 flex items-center justify-center"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
      </div>
    )
  }

  const myShifts = (weekData?.shifts ?? [])
    .filter(s => s.employee_id === employeeId)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const myRequests = requests.filter(r => r.employee_id === employeeId)
  const pendingShiftIds = new Set(myRequests.map(r => r.shift_id))

  function openRequestForm(shift: MyShift) {
    setOpenShiftId(shift.id)
    setReqStart(extractTime(shift.start_time))
    setReqEnd(extractTime(shift.end_time))
    setReqReason('')
    setReqError(null)
  }

  function closeRequestForm() {
    setOpenShiftId(null)
    setReqError(null)
  }

  async function submitRequest(shift: MyShift) {
    if (!reqStart || !reqEnd) return
    setReqSubmitting(true)
    setReqError(null)
    try {
      const res = await fetch('/api/shift-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id:        shift.id,
          employee_id:     employeeId,
          type:            'modify',
          requested_start: reqStart,
          requested_end:   reqEnd,
          requested_date:  toISODate(new Date(shift.start_time)),
          reason:          reqReason || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setReqError(json.error ?? "Erreur lors de l'envoi.")
        return
      }
      setOpenShiftId(null)
      await load()
    } catch {
      setReqError('Erreur réseau.')
    } finally {
      setReqSubmitting(false)
    }
  }

  async function clockIn() {
    setClockLoading(true)
    setClockError(null)
    try {
      const todayShift = myShifts.find(s => {
        const d = new Date(s.start_time)
        const today = new Date()
        return d.toDateString() === today.toDateString()
      })
      const res = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: todayShift?.id ?? null }),
      })
      const json = await res.json()
      if (!res.ok) { setClockError(json.error ?? 'Erreur.'); return }
      setTimeLog(json.log)
    } catch {
      setClockError('Erreur réseau.')
    } finally {
      setClockLoading(false)
    }
  }

  async function clockOut() {
    if (!timeLog) return
    setClockLoading(true)
    setClockError(null)
    try {
      const res = await fetch('/api/time-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: timeLog.id }),
      })
      const json = await res.json()
      if (!res.ok) { setClockError(json.error ?? 'Erreur.'); return }
      setTimeLog(json.log)
    } catch {
      setClockError('Erreur réseau.')
    } finally {
      setClockLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Pointeuse ───────────────────────────────────── */}
      <div
        className="rounded-[20px] p-5 flex items-center justify-between gap-4"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            <Timer className="w-4 h-4" style={{ color: '#7798AB' }} />
            Pointeuse
          </h2>
          {timeLog?.clock_in && !timeLog.clock_out && (
            <p className="text-[12px] mt-1" style={{ color: '#34D399' }}>
              Arrivée à {formatTime(extractTime(timeLog.clock_in))} · en cours depuis {formatElapsed(timeLog.clock_in)}
            </p>
          )}
          {timeLog?.clock_in && timeLog.clock_out && (
            <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Terminé — {formatElapsed(timeLog.clock_in, timeLog.clock_out)} aujourd&apos;hui
            </p>
          )}
          {!timeLog && (
            <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Pas encore pointé aujourd&apos;hui.
            </p>
          )}
          {clockError && (
            <p className="text-[12px] mt-1" style={{ color: '#F87171' }}>{clockError}</p>
          )}
        </div>

        {!timeLog || timeLog.clock_out ? (
          <button
            type="button"
            disabled={clockLoading || !!timeLog?.clock_out}
            onClick={clockIn}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-full disabled:opacity-50 flex-shrink-0"
            style={{ background: '#7798AB', color: '#0F0F0F' }}
          >
            {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Pointer l&apos;arrivée
          </button>
        ) : (
          <button
            type="button"
            disabled={clockLoading}
            onClick={clockOut}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-full disabled:opacity-50 flex-shrink-0"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Pointer le départ
          </button>
        )}
      </div>

      {/* ── Mon planning cette semaine ─────────────────── */}
      <div
        className="rounded-[20px] p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          <CalendarDays className="w-4 h-4" style={{ color: '#7798AB' }} />
          Mon planning cette semaine
        </h2>

        {myShifts.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Aucun créneau prévu cette semaine.
          </p>
        ) : (
          <div className="space-y-2">
            {myShifts.map(shift => {
              const isOpen         = openShiftId === shift.id
              const alreadyPending = pendingShiftIds.has(shift.id)

              return (
                <div
                  key={shift.id}
                  className="rounded-[12px] px-4 py-3"
                  style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold capitalize" style={{ color: '#FFFFFF' }}>
                        {formatDayLabel(new Date(shift.start_time), false)}
                      </p>
                      {shift.position && (
                        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {shift.position}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums" style={{ color: '#7798AB' }}>
                        <Clock3 className="w-3.5 h-3.5" />
                        {formatTime(extractTime(shift.start_time))}–{formatTime(extractTime(shift.end_time))}
                      </span>
                      {!alreadyPending && !isOpen && (
                        <button
                          type="button"
                          onClick={() => openRequestForm(shift)}
                          className="text-[12px] font-medium px-3 py-1.5 rounded-full"
                          style={{ background: 'rgba(119,152,171,0.12)', color: '#7798AB', border: '1px solid rgba(119,152,171,0.25)' }}
                        >
                          Demander un changement
                        </button>
                      )}
                      {alreadyPending && (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24' }}>
                          Demande envoyée
                        </span>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Propose de nouvelles heures pour ce créneau (heures sup ou en moins) — ton employeur devra valider.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={reqStart}
                          onChange={e => setReqStart(e.target.value)}
                          className="px-3 py-2 rounded-[10px] text-[13px] tabular-nums"
                          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                        <input
                          type="time"
                          value={reqEnd}
                          onChange={e => setReqEnd(e.target.value)}
                          className="px-3 py-2 rounded-[10px] text-[13px] tabular-nums"
                          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                        />
                      </div>
                      <textarea
                        value={reqReason}
                        onChange={e => setReqReason(e.target.value)}
                        placeholder="Raison (optionnel)"
                        rows={2}
                        className="w-full px-3 py-2 rounded-[10px] text-[13px] resize-none"
                        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                      />
                      {reqError && (
                        <p className="text-[12px]" style={{ color: '#F87171' }}>{reqError}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={reqSubmitting}
                          onClick={() => submitRequest(shift)}
                          className="flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-2 rounded-full disabled:opacity-60"
                          style={{ background: '#7798AB', color: '#0F0F0F' }}
                        >
                          {reqSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Envoyer la demande
                        </button>
                        <button
                          type="button"
                          onClick={closeRequestForm}
                          className="text-[12px] font-medium px-3 py-2"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Mes demandes (en attente + historique récent) ─── */}
      <div
        className="rounded-[20px] p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          <MessageSquareDiff className="w-4 h-4" style={{ color: '#7798AB' }} />
          Mes demandes
        </h2>

        {myRequests.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Aucune demande envoyée pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-2">
            {myRequests.map(req => {
              const statusStyle =
                req.status === 'approved'
                  ? { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34D399', label: 'Approuvée' }
                  : req.status === 'rejected'
                  ? { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#F87171', label: 'Refusée' }
                  : { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#FBBF24', label: 'En attente' }

              return (
                <div
                  key={req.id}
                  className="rounded-[12px] px-4 py-3"
                  style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium" style={{ color: statusStyle.text }}>
                      {toISODate(new Date(req.requested_date))} · {req.requested_start}–{req.requested_end}
                    </p>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: statusStyle.border, color: statusStyle.text }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {req.reason}
                    </p>
                  )}
                  {req.manager_note && (
                    <p className="text-[12px] mt-1.5 pt-1.5" style={{ color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      Note du responsable : {req.manager_note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
