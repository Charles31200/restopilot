'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Employee } from '@/types'

// ── Props ─────────────────────────────────────────────────────

type InviteEmployeeModalProps = {
  employees: Employee[]
  onClose:   () => void
}

// ── Helpers ───────────────────────────────────────────────────

const inputCls = (hasError?: boolean) => cn(
  'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all border',
  hasError
    ? 'border-red-400 bg-red-500/10 text-red-400 focus:ring-2 focus:ring-red-400/20'
    : 'border-white/10 bg-[#111111] text-white focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
)

// ── Composant ─────────────────────────────────────────────────

export function InviteEmployeeModal({ employees, onClose }: InviteEmployeeModalProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [email,       setEmail]     = useState('')
  const [sending,     setSending]   = useState(false)
  const [error,       setError]     = useState<string | null>(null)
  const [sentTo,      setSentTo]    = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !email) return
    setSending(true)
    setError(null)
    try {
      const res  = await fetch('/api/invitations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ employee_id: employeeId, email }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Impossible d\'envoyer l\'invitation.')
        return
      }
      setSentTo(email)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  const footer = sentTo ? (
    <button
      type="button"
      onClick={onClose}
      className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
      style={{ background: '#7798AB' }}
    >
      Fermer
    </button>
  ) : (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit"
        form="invite-employee-form"
        disabled={sending || !employeeId || !email}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-xl transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ background: '#7798AB' }}
      >
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}
        Envoyer
      </button>
    </div>
  )

  return (
    <Modal title="Inviter un employé" onClose={onClose} maxWidth="max-w-md" footer={footer}>
      {sentTo ? (
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.15)' }}
          >
            <CheckCircle2 className="w-6 h-6" style={{ color: '#4ADE80' }} />
          </div>
          <p className="text-sm" style={{ color: '#FFFFFF' }}>
            Invitation envoyée à <strong>{sentTo}</strong> ✅
          </p>
        </div>
      ) : (
        <form id="invite-employee-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Employé *</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className={inputCls()}
              required
            >
              <option value="">— Sélectionner —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} — {emp.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Adresse email *</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="employe@exemple.com"
                className={inputCls()}
                required
              />
              <Send className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
