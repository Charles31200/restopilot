'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import { extractTime } from '@/lib/utils/week-utils'

// ── Types ─────────────────────────────────────────────────────

type ShiftRequest = {
  id: string
  shift_id: string
  employee_id: string
  proposed_start: string
  proposed_end: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  created_at: string
  employee: {
    id: string
    first_name: string
    last_name: string
    role: string
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
  /** Appelé quand une demande est approuvée (pour refetch la semaine) */
  onApproved: () => void
}

// ── Helpers ────────────────────────────────────────────────────

function formatTime(iso: string) {
  return extractTime(iso)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Composant ─────────────────────────────────────────────────

export function ShiftRequestsPanel({ onClose, onApproved }: ShiftRequestsPanelProps) {
  const [requests,    setRequests]    = useState<ShiftRequest[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [processing,  setProcessing]  = useState<string | null>(null) // request id en cours
  const [noteValues,  setNoteValues]  = useState<Record<string, string>>({})

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

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)
    try {
      const res = await fetch('/api/shift-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id:   requestId,
          action,
          manager_note: noteValues[requestId] ?? undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erreur lors du traitement.')
        return
      }
      // Retirer la demande de la liste
      setRequests(prev => prev.filter(r => r.id !== requestId))
      if (action === 'approve') onApproved()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <Modal
      title="Demandes de modification"
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-600">{error}</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
          <p className="text-sm font-medium text-gray-600">Aucune demande en attente</p>
          <p className="text-xs text-gray-400">Toutes les demandes ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const isProcessing = processing === req.id
            const currentStart = formatTime(req.shift.start_time)
            const currentEnd   = formatTime(req.shift.end_time)
            const newStart     = formatTime(req.proposed_start)
            const newEnd       = formatTime(req.proposed_end)
            const shiftDate    = formatDate(req.shift.start_time)

            return (
              <div key={req.id} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* En-tête employé */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: req.employee.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {req.employee.first_name} {req.employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{shiftDate}</p>
                  </div>
                  {req.shift.position && (
                    <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {req.shift.position}
                    </span>
                  )}
                </div>

                {/* Corps */}
                <div className="px-4 py-3 space-y-3">
                  {/* Horaires : actuel → proposé */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1 text-center rounded-lg py-2 px-3 bg-gray-50 border border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Actuel</p>
                      <p className="font-semibold text-gray-700 tabular-nums">
                        {currentStart} – {currentEnd}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-center rounded-lg py-2 px-3 bg-blue-50 border border-blue-200">
                      <p className="text-[10px] text-blue-500 uppercase tracking-wide mb-1">Proposé</p>
                      <p className="font-semibold text-blue-800 tabular-nums">
                        {newStart} – {newEnd}
                      </p>
                    </div>
                  </div>

                  {/* Raison */}
                  {req.reason && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                      <p className="text-xs leading-relaxed">{req.reason}</p>
                    </div>
                  )}

                  {/* Note manager (optionnelle) */}
                  <input
                    type="text"
                    placeholder="Note optionnelle (visible par l'employé)"
                    value={noteValues[req.id] ?? ''}
                    onChange={e => setNoteValues(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-gray-400"
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors',
                        'border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50'
                      )}
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Refuser
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border transition-colors',
                        'border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50'
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
