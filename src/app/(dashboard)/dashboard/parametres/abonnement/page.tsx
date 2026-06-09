'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, FileText, AlertTriangle, CheckCircle2, Loader2,
  ExternalLink, Download, RefreshCw, XCircle, Zap, Star, Building2,
  Calendar, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types'

// ── Types ─────────────────────────────────────────────────────

type SubscriptionInfo = {
  plan:                 SubscriptionPlan
  status:               SubscriptionStatus
  current_period_end:   string | null
  stripe_customer_id:   string | null
  cancel_at_period_end: boolean
}

type StripeInvoice = {
  id:         string
  number:     string | null
  date:       number
  amount:     number
  status:     string | null
  pdf_url:    string | null
  hosted_url: string | null
}

// ── Config plans ──────────────────────────────────────────────

const PLAN_CONFIG: Record<SubscriptionPlan, {
  name:        string
  price:       string
  color:       string
  bgColor:     string
  borderColor: string
  icon:        React.ReactNode
}> = {
  starter: {
    name: 'Starter', price: '49€/mois',
    color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200',
    icon: <Zap className="w-5 h-5" />,
  },
  pro: {
    name: 'Pro', price: '79€/mois',
    color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300',
    icon: <Star className="w-5 h-5" />,
  },
  multi: {
    name: 'Multi-sites', price: '149€/mois',
    color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200',
    icon: <Building2 className="w-5 h-5" />,
  },
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Actif',          color: 'text-green-700',  bg: 'bg-green-100'  },
  trialing:  { label: 'Essai gratuit',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  past_due:  { label: 'Paiement en retard', color: 'text-red-700', bg: 'bg-red-100'   },
  canceled:  { label: 'Annulé',         color: 'text-gray-600',   bg: 'bg-gray-100'   },
}

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(ts: number | string | null) {
  if (!ts) return '—'
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(isoDate: string | null): number {
  if (!isoDate) return 0
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000))
}

// ── Page ──────────────────────────────────────────────────────

export default function AbonnementPage() {
  const [sub,       setSub]       = useState<SubscriptionInfo | null>(null)
  const [invoices,  setInvoices]  = useState<StripeInvoice[]>([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState<string | null>(null)
  const [message,   setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Chargement ────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, invRes] = await Promise.all([
        fetch('/api/stripe/status'),
        fetch('/api/stripe/invoices'),
      ])
      if (subRes.ok) setSub(await subRes.json())
      if (invRes.ok) {
        const { invoices: inv } = await invRes.json()
        setInvoices(inv ?? [])
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Actions ───────────────────────────────────────────────────

  const openPortal = async () => {
    setActing('portal')
    setMessage(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setMessage({ type: 'error', text: json.error ?? 'Erreur portail Stripe' })
    } finally { setActing(null) }
  }

  const cancelSub = async () => {
    if (!confirm('Annuler votre abonnement ? Vous garderez l\'accès jusqu\'à la fin de la période en cours.')) return
    setActing('cancel')
    setMessage(null)
    try {
      const res  = await fetch('/api/stripe/cancel', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: 'Abonnement annulé. Accès maintenu jusqu\'à la fin de la période.' })
        loadData()
      } else {
        setMessage({ type: 'error', text: json.error ?? 'Erreur lors de l\'annulation' })
      }
    } finally { setActing(null) }
  }

  const reactivate = async () => {
    setActing('reactivate')
    setMessage(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setMessage({ type: 'error', text: json.error ?? 'Erreur portail Stripe' })
    } finally { setActing(null) }
  }

  // ── Rendu ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon abonnement</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez votre plan, votre facturation et vos factures.</p>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={cn(
          'flex items-start gap-2 p-4 rounded-xl border text-sm',
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        )}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          }
          {message.text}
        </div>
      )}

      {/* Bannière paiement en retard */}
      {sub?.status === 'past_due' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Paiement en retard</p>
            <p className="text-xs text-red-700 mt-1">
              Un paiement a échoué. Mettez à jour votre moyen de paiement pour éviter la suspension de votre compte.
            </p>
            <button onClick={openPortal} disabled={acting === 'portal'}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
              {acting === 'portal' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              Mettre à jour mon paiement
            </button>
          </div>
        </div>
      )}

      {/* Bannière abonnement annulé */}
      {sub?.status === 'canceled' && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-5 flex items-start gap-4">
          <XCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Abonnement annulé</p>
            <p className="text-xs text-gray-600 mt-1">Votre accès a expiré. Réactivez pour retrouver toutes vos données.</p>
            <button onClick={reactivate} disabled={acting === 'reactivate'}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
              {acting === 'reactivate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Réactiver mon abonnement
            </button>
          </div>
        </div>
      )}

      {/* Plan actuel */}
      {sub && (
        <div className={cn(
          'rounded-2xl border-2 p-5 space-y-4',
          PLAN_CONFIG[sub.plan].bgColor,
          PLAN_CONFIG[sub.plan].borderColor
        )}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-white/60')}>
                <span className={PLAN_CONFIG[sub.plan].color}>{PLAN_CONFIG[sub.plan].icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Plan {PLAN_CONFIG[sub.plan].name}
                </p>
                <p className={cn('text-xs font-semibold', PLAN_CONFIG[sub.plan].color)}>
                  {PLAN_CONFIG[sub.plan].price}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge statut */}
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                STATUS_LABELS[sub.status].bg,
                STATUS_LABELS[sub.status].color
              )}>
                {STATUS_LABELS[sub.status].label}
              </span>

              {/* Annulation programmée */}
              {sub.cancel_at_period_end && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-semibold">
                  Fin le {formatDate(sub.current_period_end)}
                </span>
              )}
            </div>
          </div>

          {/* Date de fin de période */}
          {sub.current_period_end && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5" />
              {sub.cancel_at_period_end
                ? `Accès jusqu'au ${formatDate(sub.current_period_end)}`
                : sub.status === 'trialing'
                  ? `Essai gratuit — se termine le ${formatDate(sub.current_period_end)} (${daysLeft(sub.current_period_end)} jours restants)`
                  : `Prochain renouvellement le ${formatDate(sub.current_period_end)}`
              }
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={openPortal} disabled={!!acting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors">
              {acting === 'portal'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Chargement…</>
                : <><CreditCard className="w-3.5 h-3.5" />Changer de plan</>
              }
            </button>

            <a href="/pricing"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />Voir les plans
            </a>

            {sub.status === 'active' && !sub.cancel_at_period_end && (
              <button onClick={cancelSub} disabled={!!acting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 bg-white rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors">
                {acting === 'cancel'
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Annulation…</>
                  : <><XCircle className="w-3.5 h-3.5" />Annuler l'abonnement</>
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* Liste des factures */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Mes factures</h2>
          </div>
          <button onClick={loadData} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Aucune facture pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {inv.number ?? inv.id.slice(0, 12).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-gray-400">{formatDate(inv.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {fmt(inv.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    {inv.pdf_url && (
                      <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Télécharger PDF">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {inv.hosted_url && (
                      <a href={inv.hosted_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir en ligne">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
