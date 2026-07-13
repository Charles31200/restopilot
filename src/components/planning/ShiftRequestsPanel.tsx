'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type ShiftRequest = {
  id: string
  shift_id: string
  employee_id: string
  type: string
  requested_start: string   // HH:MM
  requested_end: string     // HH:MM
  requested_date: string    // YYYY-MM-DD
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  created_at: string
  employee: {
    id: string
    first_name: string
    last_name: string
    color: string
  }
  shift: {
    id: string
    start_time: string
    end_time: string
    position: string | null
  }
}

// ── Props ─────────────────────────────────────────────────────

type ShiftRequestsPanelProps = {
  onClose: () => void
  onApproved: () => void
}

// ── Helpers ────────────────────────────────────────────────────

function extractHHMM(iso: string): string {
  // Fonctionne sur "2026-07-07T09:00:00" → "09:00" et "09:00" → "09:00"
  if (iso.includes('T')) return iso.slice(11, 16)
  return iso.slice(0, 5)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ── Composant ─────────────────────────────────────────────────

export function ShiftRequestsPanel({ onClose, onApproved }: ShiftRequestsPanelProps) {
  const [requests,   setRequests]   = useState<ShiftRequest[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<Record<string, string>>({})

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/shift-requests')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRequests(json.requests ?? [])
    } catch {
      setError('Impossible de charger les demandes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(requestId)
    try {
      const res = await fetch('/api/shift-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:           requestId,
          status,
          manager_note: noteValues[requestId] ?? undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erreur lors du traitement.')
        return
      }
      setRequests(prev => prev.filter(r => r.id !== requestId))
      if (status === 'approved') onApproved()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <Modal title="Demandes de modification" onClose={onClose} maxWidth="max-w-xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-400">{error}</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
          <p className="text-sm font-medium text-white/60">Aucune demande en attente</p>
          <p className="text-xs text-white/30">Toutes les demandes ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const isProcessing = processing === req.id
            const currentStart = extractHHMM(req.shift.start_time)
            const currentEnd   = extractHHMM(req.shift.end_time)

            return (
              <div key={req.id} className="rounded-xl border border-white/8 overflow-hidden">
                {/* En-tête employé */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border-b border-white/6">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: req.employee.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-none">
                      {req.employee.first_name} {req.employee.last_name}
                    </p>
                    <p className="text-xs text-white/45 mt-0.5">{formatDate(req.requested_date)}</p>
                  </div>
                  {req.shift.position && (
                    <span className="text-[10px] font-medium text-white/45 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                      {req.shift.position}
                    </span>
                  )}
                </div>

                {/* Corps */}
                <div className="px-4 py-3 space-y-3">
                  {/* Horaires : actuel → demandé */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1 text-center rounded-lg py-2 px-3 bg-white/5 border border-white/8">
                      <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Actuel</p>
                      <p className="font-semibold text-white/70 tabular-nums">
                        {currentStart} – {currentEnd}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <div className="flex-1 text-center rounded-lg py-2 px-3 bg-[#7798AB]/15 border border-[#7798AB]/30">
                      <p className="text-[10px] text-[#7798AB] uppercase tracking-wide mb-1">Demandé</p>
                      <p className="font-semibold text-[#8FADC0] tabular-nums">
                        {req.requested_start} – {req.requested_end}
                      </p>
                    </div>
                  </div>

                  {/* Raison */}
                  {req.reason && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                      <p className="text-xs text-white/60 leading-relaxed">{req.reason}</p>
                    </div>
                  )}

                  {/* Note manager */}
                  <input
                    type="text"
                    placeholder="Note optionnelle (visible par l'employé)"
                    value={noteValues[req.id] ?? ''}
                    onChange={e => setNoteValues(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-white/8 rounded-lg outline-none focus:ring-2 focus:ring-[#7798AB]/20 focus:border-[#7798AB] placeholder:text-white/30"
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'rejected')}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors',
                        'border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50'
                      )}
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Refuser
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approved')}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors',
                        'border-green-500/20 text-green-400 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50'
                      )}
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approuver
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
