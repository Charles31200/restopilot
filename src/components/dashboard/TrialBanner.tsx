'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, X, CreditCard } from 'lucide-react'

type SubInfo = {
  status:             string
  current_period_end: string | null
  created_at:         string | null
}

function trialEndDate(sub: SubInfo): Date | null {
  if (sub.current_period_end) return new Date(sub.current_period_end)
  if (sub.created_at) {
    const d = new Date(sub.created_at)
    d.setDate(d.getDate() + 14)
    return d
  }
  return null
}

function daysLeft(date: Date | null): number {
  if (!date) return 0
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000))
}

export function TrialBanner() {
  const [sub,       setSub]       = useState<SubInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/stripe/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.status === 'trialing') setSub(data) })
      .catch(() => {})
  }, [])

  if (!sub || dismissed) return null

  const end  = trialEndDate(sub)
  const days = daysLeft(end)
  const isUrgent = days <= 3

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium border-b ${
        isUrgent
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      }`}
    >
      {isUrgent
        ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
        : <Clock         className="w-4 h-4 text-amber-400 flex-shrink-0" />
      }

      <span className="flex-1 min-w-0 truncate">
        {isUrgent
          ? `⚠️ Votre essai se termine dans ${days} jour${days !== 1 ? 's' : ''} — Ajoutez une carte pour continuer`
          : `🎉 Essai gratuit — ${days} jour${days !== 1 ? 's' : ''} restant${days !== 1 ? 's' : ''}`
        }
      </span>

      {isUrgent && (
        <a
          href="/dashboard/compte"
          className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <CreditCard className="w-3 h-3" />
          Ajouter une carte
        </a>
      )}

      <button
        onClick={() => setDismissed(true)}
        aria-label="Fermer la bannière"
        className={`p-1 rounded transition-colors flex-shrink-0 ${
          isUrgent ? 'hover:bg-red-500/15' : 'hover:bg-amber-500/15'
        }`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
