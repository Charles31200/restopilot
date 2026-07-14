'use client'

import { useEffect, useState } from 'react'
import { Loader2, CalendarDays, Clock3, MessageSquareDiff } from 'lucide-react'
import { getCurrentWeek, formatDayLabel, extractTime, formatTime, toISODate } from '@/lib/utils/week-utils'
import type { WeekData } from '@/types/planning'
import type { ShiftRequest } from '@/types'

export function EmployeeDashboardClient({ employeeId }: { employeeId: string }) {
  const [weekData,  setWeekData]  = useState<WeekData | null>(null)
  const [requests,  setRequests]  = useState<ShiftRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const week = getCurrentWeek()
        const [shiftsRes, requestsRes] = await Promise.all([
          fetch(`/api/shifts?week=${week}`),
          fetch('/api/shift-requests'),
        ])
        const shiftsJson   = shiftsRes.ok   ? await shiftsRes.json()   : null
        const requestsJson = requestsRes.ok ? await requestsRes.json() : null
        if (cancelled) return
        if (shiftsJson)   setWeekData(shiftsJson)
        if (requestsJson) setRequests(requestsJson.requests ?? [])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
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

  return (
    <div className="space-y-5">
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
            {myShifts.map(shift => (
              <div
                key={shift.id}
                className="flex items-center justify-between gap-3 rounded-[12px] px-4 py-3"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
              >
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
                <span className="flex items-center gap-1.5 text-[13px] font-medium tabular-nums" style={{ color: '#7798AB' }}>
                  <Clock3 className="w-3.5 h-3.5" />
                  {formatTime(extractTime(shift.start_time))}–{formatTime(extractTime(shift.end_time))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mes demandes en attente ────────────────────── */}
      <div
        className="rounded-[20px] p-5"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          <MessageSquareDiff className="w-4 h-4" style={{ color: '#7798AB' }} />
          Mes demandes en attente
        </h2>

        {myRequests.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Aucune demande en attente.
          </p>
        ) : (
          <div className="space-y-2">
            {myRequests.map(req => (
              <div
                key={req.id}
                className="rounded-[12px] px-4 py-3"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                <p className="text-[13px] font-medium" style={{ color: '#FBBF24' }}>
                  {toISODate(new Date(req.requested_date))} · {req.requested_start}–{req.requested_end}
                </p>
                {req.reason && (
                  <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {req.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
