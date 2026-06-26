'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Zap, Star, Building2, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Price IDs ─────────────────────────────────────────────────

const PLANS = [
  {
    id:            'starter' as const,
    name:          'Starter',
    description:   'Idéal pour démarrer et structurer votre gestion.',
    monthlyPrice:   39,
    annualMonthly:  31,
    annualTotal:    368,
    priceIdMonthly: 'price_1TjRUOEw9od5qGxlnDbe4Nqv',
    priceIdAnnual:  'price_1TjRUOEw9od5qGxlmwXgMQQD',
    icon:           <Zap className="w-5 h-5" />,
    features: ['1 restaurant', 'Dashboard financier', 'Stocks & inventaires', "Planning jusqu'à 10 employés", 'Import CSV', 'Support email'],
  },
  {
    id:            'pro' as const,
    name:          'Pro',
    description:   'Tout automatisé pour les restaurateurs actifs.',
    monthlyPrice:   79,
    annualMonthly:  55,
    annualTotal:    663,
    priceIdMonthly: 'price_1TjRUvEw9od5qGxl9yxWt6JO',
    priceIdAnnual:  'price_1TjRVfEw9od5qGxlsOTeBSyV',
    icon:           <Star className="w-5 h-5" />,
    badge:          'Le plus populaire',
    features: ['Tout Starter', 'Intégrations caisses', 'Synchro automatique', 'Planning illimité', 'Export FEC', 'Scan factures IA', 'Support prioritaire'],
  },
  {
    id:            'multi' as const,
    name:          'Multi-sites',
    description:   'Pour les groupes et franchises.',
    monthlyPrice:   149,
    annualMonthly:  119,
    annualTotal:    1430,
    priceIdMonthly: 'price_1TjRWjEw9od5qGxlAzYYrIqd',
    priceIdAnnual:  'price_1TjRXBEw9od5qGxlw0BvlHds',
    icon:           <Building2 className="w-5 h-5" />,
    features: ["Jusqu'à 5 restaurants", 'Tout Pro', 'Dashboard consolidé', '5 utilisateurs', 'Account manager', 'SLA 99,9%'],
  },
]

// ── Bannière subscription_required ───────────────────────────

function SubBanner() {
  const sp = useSearchParams()
  if (sp.get('reason') !== 'subscription_required') return null
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 max-w-2xl mx-auto mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-900">Votre période d&rsquo;essai est terminée.</p>
        <p className="text-sm text-amber-700 mt-0.5">Choisissez un plan pour continuer à utiliser PilotResto.</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function OnboardingPaymentPage() {
  const router    = useRouter()
  const [isAnnual, setIsAnnual]   = useState(false)
  const [loading,  setLoading]    = useState<string | null>(null)
  const [apiError, setApiError]   = useState<string | null>(null)

  const handleSelect = async (priceId: string) => {
    console.log('[onboarding-payment] isAnnual:', isAnnual, '— priceId:', priceId)
    setLoading(priceId)
    setApiError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId }),
      })
      if (res.status === 401) {
        router.push(`/register?priceId=${encodeURIComponent(priceId)}`)
        return
      }
      const json = await res.json()
      if (json.url) { window.location.href = json.url; return }
      setApiError(json.error ?? 'Une erreur est survenue.')
    } catch {
      setApiError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen py-14 px-4" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Bannière abonnement requis */}
        <Suspense fallback={null}>
          <SubBanner />
        </Suspense>

        {/* En-tête */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" className="h-12 mx-auto mb-2" />
          <h1
            className="text-3xl font-extrabold"
            style={{ color: '#1B2A4A', fontFamily: 'var(--font-display, system-ui)' }}
          >
            Choisissez votre plan<br />pour commencer
          </h1>
          <p className="text-gray-500 text-base">
            Commencez votre essai gratuit de 14 jours.{' '}
            <strong className="text-gray-700">Aucun débit avant la fin de l&rsquo;essai.</strong>
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn('text-sm font-medium transition-colors', !isAnnual ? 'font-bold text-gray-900' : 'text-gray-400 hover:text-gray-600')}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsAnnual(v => !v)}
            className="relative w-12 h-6 rounded-full transition-colors duration-300"
            style={{ background: isAnnual ? '#B8962E' : '#D1D5DB' }}
            aria-label="Basculer mensuel / annuel"
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
              style={{ transform: isAnnual ? 'translateX(28px)' : 'translateX(4px)' }}
            />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnnual(true)}
              className={cn('text-sm font-medium transition-colors', isAnnual ? 'font-bold text-gray-900' : 'text-gray-400 hover:text-gray-600')}
            >
              Annuel
            </button>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              −20 %
            </span>
          </div>
        </div>

        {/* Erreur API */}
        {apiError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-red-200 bg-red-50 max-w-2xl mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => {
            const isPro    = plan.id === 'pro'
            const priceId  = isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly
            const isLoading = loading === priceId
            const price    = isAnnual ? plan.annualTotal : plan.monthlyPrice
            const period   = isAnnual ? '/an' : '/mois'

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-6 flex flex-col transition-all',
                  isPro
                    ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 scale-[1.02]'
                    : 'bg-white border-gray-200 hover:shadow-md'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isPro ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700')}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className={cn('font-bold text-base', isPro ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                    <p className={cn('text-xs', isPro ? 'text-blue-100' : 'text-gray-400')}>{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className={cn('text-4xl font-extrabold tabular-nums', isPro ? 'text-white' : 'text-gray-900')}>
                      {price}€
                    </span>
                    <span className={cn('text-sm pb-1', isPro ? 'text-blue-100' : 'text-gray-400')}>{period}</span>
                  </div>
                  {isAnnual && (
                    <p className={cn('text-xs mt-0.5 font-medium', isPro ? 'text-blue-100' : 'text-green-600')}>
                      soit {plan.annualMonthly}€/mois
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(priceId)}
                  disabled={!!loading}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-5',
                    isPro
                      ? 'bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-60'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:opacity-80 disabled:opacity-60'
                  )}
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Redirection…</>
                    : <><ArrowRight className="w-4 h-4" />Commencer l&rsquo;essai gratuit</>
                  }
                </button>

                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={cn('flex items-start gap-2.5 text-xs', isPro ? 'text-white' : 'text-gray-700')}>
                      <Check className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', isPro ? 'text-white' : 'text-green-500')} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'Sans engagement',    desc: 'Annulez à tout moment depuis votre espace client.' },
            { icon: '💳', title: 'Paiement sécurisé',  desc: 'CB enregistrée maintenant, débitée seulement après 14 jours.' },
            { icon: '🇫🇷', title: 'Hébergé en Europe', desc: 'Données stockées sur des serveurs européens (RGPD).' },
          ].map(g => (
            <div key={g.title} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <div className="text-2xl mb-2">{g.icon}</div>
              <p className="text-sm font-semibold text-gray-900">{g.title}</p>
              <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
