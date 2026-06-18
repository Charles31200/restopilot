'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Calendar, Loader2, CheckCircle2, Clock,
  AlertTriangle, ArrowUpRight, Zap, Star, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types'

// ── Types ─────────────────────────────────────────────────────

type SubInfo = {
  plan:                 SubscriptionPlan
  status:               SubscriptionStatus
  current_period_end:   string | null
  stripe_customer_id:   string | null
  cancel_at_period_end: boolean
}

// ── Config plans ──────────────────────────────────────────────

const PLAN_CONFIG: Record<SubscriptionPlan, {
  name:   string
  price:  string
  icon:   React.ReactNode
  color:  string
  bg:     string
  border: string
}> = {
  starter: {
    name: 'Starter', price: '49 €/mois',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
  },
  pro: {
    name: 'Pro', price: '79 €/mois',
    icon: <Star className="w-5 h-5" />,
    color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300',
  },
  multi: {
    name: 'Multi-sites', price: '149 €/mois',
    icon: <Building2 className="w-5 h-5" />,
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200',
  },
}

// ── Helpers ───────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysLeft(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

// ── Page ──────────────────────────────────────────────────────

export default function ComptePage() {
  const [sub,     setSub]     = useState<SubInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/status')
      if (res.ok) setSub(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openPortal = async () => {
    setActing(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setError(json.error ?? 'Impossible d\'ouvrir le portail Stripe.')
    } catch {
      setError('Erreur réseau.')
    } finally {
      setActing(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  // ── Aucun abonnement ───────────────────────────────────────

  if (!sub) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
          <p className="text-sm text-gray-400 mt-1">Abonnement et facturation.</p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Aucun abonnement actif</p>
            <p className="text-xs text-gray-400 mt-1">
              Choisissez un plan pour accéder à toutes les fonctionnalités.
            </p>
          </div>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Choisir un plan
          </a>
        </div>
      </div>
    )
  }

  const plan   = PLAN_CONFIG[sub.plan]
  const days   = daysLeft(sub.current_period_end)
  const isTrial = sub.status === 'trialing'
  const isActive = sub.status === 'active'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p className="text-sm text-gray-400 mt-1">Abonnement et facturation.</p>
      </div>

      {/* Erreur portail */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Carte plan actuel */}
      <div className={cn('rounded-2xl border-2 p-6 space-y-5', plan.bg, plan.border)}>
        {/* Plan + statut */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
              <span className={plan.color}>{plan.icon}</span>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Plan {plan.name}</p>
              <p className={cn('text-xs font-semibold', plan.color)}>{plan.price}</p>
            </div>
          </div>

          {/* Badge statut */}
          {isActive && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3" />Actif
            </span>
          )}
          {isTrial && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
              <Clock className="w-3 h-3" />Essai gratuit
            </span>
          )}
          {sub.status === 'past_due' && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />Paiement en retard
            </span>
          )}
        </div>

        {/* Date / période */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {isTrial ? (
            <span>
              Essai gratuit —{' '}
              <strong>{days} jour{days !== 1 ? 's' : ''} restant{days !== 1 ? 's' : ''}</strong>
              {sub.current_period_end && (
                <span className="text-gray-400"> (jusqu'au {formatDate(sub.current_period_end)})</span>
              )}
            </span>
          ) : sub.cancel_at_period_end ? (
            <span>Accès jusqu'au <strong>{formatDate(sub.current_period_end)}</strong></span>
          ) : isActive ? (
            <span>Actif jusqu'au <strong>{formatDate(sub.current_period_end)}</strong></span>
          ) : (
            <span>Période terminée le <strong>{formatDate(sub.current_period_end)}</strong></span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={openPortal}
            disabled={acting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {acting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Chargement…</>
              : <><CreditCard className="w-4 h-4" />Gérer mon abonnement</>
            }
          </button>

          <a
            href="/pricing"
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors',
              plan.color, plan.bg, plan.border, 'hover:opacity-80'
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Voir les plans
          </a>
        </div>
      </div>

      {/* Lien vers la page complète */}
      <p className="text-xs text-center text-gray-400">
        Pour voir vos factures et annuler votre abonnement, rendez-vous sur la{' '}
        <a href="/dashboard/parametres/abonnement" className="text-blue-600 hover:underline">
          page facturation complète
        </a>.
      </p>
    </div>
  )
}
