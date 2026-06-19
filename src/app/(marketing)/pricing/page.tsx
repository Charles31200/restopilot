'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check, Zap, Star, Building2, ArrowRight, Loader2, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type Interval = 'monthly' | 'annual'

type PlanFeature = { text: string; included: boolean }

type Plan = {
  id:             'starter' | 'pro' | 'multi'
  name:           string
  description:    string
  monthlyPrice:   number   // prix affiché en mensuel (€/mois)
  annualTotal:    number   // total facturé en annuel (€/an)
  annualMonthly:  number   // équivalent mensuel en annuel (pour "soit X€/mois")
  priceIdMonthly: string
  priceIdAnnual:  string
  icon:           React.ReactNode
  color:          string
  bgColor:        string
  borderColor:    string
  badge?:         string
  features:       PlanFeature[]
}

// ── Données des plans ─────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id:            'starter',
    name:          'Starter',
    description:   'Idéal pour démarrer et structurer votre gestion.',
    monthlyPrice:   39,
    annualTotal:    368,
    annualMonthly:  31,
    priceIdMonthly: 'price_1TjRUOEw9od5qGxlnDbe4Nqv',  // Starter 39€/mois
    priceIdAnnual:  'price_1TjRUOEw9od5qGxlmwXgMQQD',  // Starter 368€/an
    icon:   <Zap className="w-5 h-5" />,
    color:  'text-blue-700',
    bgColor:     'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      { text: '1 restaurant',                       included: true  },
      { text: 'Tableau de bord financier',           included: true  },
      { text: 'Gestion des stocks & inventaires',    included: true  },
      { text: "Planning (jusqu'à 10 employés)",      included: true  },
      { text: 'Import CSV des ventes',               included: true  },
      { text: 'Rapport hebdomadaire par email',      included: true  },
      { text: 'Support par email',                   included: true  },
      { text: 'Intégrations caisses (Lightspeed…)',  included: false },
      { text: 'Synchronisation automatique',         included: false },
      { text: 'Export FEC comptable',                included: false },
      { text: 'Scan de factures par IA',             included: false },
    ],
  },
  {
    id:            'pro',
    name:          'Pro',
    description:   'Tout automatisé pour les restaurateurs actifs.',
    monthlyPrice:   79,
    annualTotal:    663,
    annualMonthly:  55,
    priceIdMonthly: 'price_1TjRUvEw9od5qGxl9yxWt6JO',  // Pro 79€/mois
    priceIdAnnual:  'price_1TjRVfEw9od5qGxlsOTeBSyV',  // Pro 663€/an
    badge:         'Le plus populaire',
    icon:   <Star className="w-5 h-5" />,
    color:  'text-white',
    bgColor:     'bg-blue-600',
    borderColor: 'border-blue-600',
    features: [
      { text: '1 restaurant',                                      included: true  },
      { text: 'Tout Starter',                                      included: true  },
      { text: 'Intégrations caisses (Lightspeed, Tiller, Zelty)', included: true  },
      { text: 'Synchronisation automatique des ventes',            included: true  },
      { text: 'Planning illimité (employés illimités)',             included: true  },
      { text: 'Export FEC comptable',                              included: true  },
      { text: 'Scan de factures par IA (OCR)',                     included: true  },
      { text: 'Rapports financiers avancés',                       included: true  },
      { text: 'Support prioritaire (< 4h)',                        included: true  },
      { text: 'Dashboard multi-sites',                             included: false },
      { text: 'Accès multi-utilisateurs',                          included: false },
    ],
  },
  {
    id:            'multi',
    name:          'Multi-sites',
    description:   'Pour les groupes et franchises multi-restaurants.',
    monthlyPrice:   149,
    annualTotal:    1430,
    annualMonthly:  119,
    priceIdMonthly: 'price_1TjRWjEw9od5qGxlAzYYrIqd',  // Multi 149€/mois
    priceIdAnnual:  'price_1TjRXBEw9od5qGxlw0BvlHds',  // Multi 1430€/an
    icon:   <Building2 className="w-5 h-5" />,
    color:  'text-purple-700',
    bgColor:     'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      { text: "Jusqu'à 5 restaurants",               included: true },
      { text: 'Tout Pro',                            included: true },
      { text: 'Dashboard consolidé multi-sites',     included: true },
      { text: '5 utilisateurs inclus',               included: true },
      { text: 'Rapports croisés entre sites',        included: true },
      { text: 'API dédiée avec rate-limit élevé',    included: true },
      { text: 'Account manager dédié',               included: true },
      { text: 'SLA 99,9 % (uptime garanti)',         included: true },
      { text: 'Formation & onboarding personnalisé', included: true },
      { text: 'Facturation centralisée',             included: true },
      { text: 'Intégrations sur mesure',             included: true },
    ],
  },
]

// ── Composant carte plan ──────────────────────────────────────

function PlanCard({ plan, interval, onSelect, loading }: {
  plan:     Plan
  interval: Interval
  onSelect: (priceId: string) => void
  loading:  string | null
}) {
  const isPro     = plan.id === 'pro'
  const priceId   = interval === 'monthly' ? plan.priceIdMonthly : plan.priceIdAnnual
  const isLoading = loading === priceId

  return (
    <div className={cn(
      'relative rounded-2xl border-2 p-6 flex flex-col transition-all',
      isPro
        ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 scale-[1.02]'
        : `bg-white ${plan.borderColor} hover:shadow-md`
    )}>
      {/* Badge "Le plus populaire" */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
          {plan.badge}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          isPro ? 'bg-white/20' : plan.bgColor
        )}>
          <span className={isPro ? 'text-white' : plan.color}>{plan.icon}</span>
        </div>
        <div>
          <h3 className={cn('font-bold text-base', isPro ? 'text-white' : 'text-gray-900')}>
            {plan.name}
          </h3>
          <p className={cn('text-xs', isPro ? 'text-blue-100' : 'text-gray-400')}>
            {plan.description}
          </p>
        </div>
      </div>

      {/* Prix */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className={cn('text-4xl font-extrabold tabular-nums', isPro ? 'text-white' : 'text-gray-900')}>
            {interval === 'monthly' ? plan.monthlyPrice : plan.annualTotal}€
          </span>
          <span className={cn('text-sm pb-1', isPro ? 'text-blue-100' : 'text-gray-400')}>
            {interval === 'monthly' ? '/mois' : '/an'}
          </span>
        </div>
        {interval === 'annual' && (
          <p className={cn('text-xs mt-0.5 font-medium', isPro ? 'text-blue-100' : 'text-green-600')}>
            soit {plan.annualMonthly}€/mois
          </p>
        )}
        {interval === 'monthly' && (
          <p className={cn('text-xs mt-0.5', isPro ? 'text-blue-200' : 'text-gray-300')}>
            &nbsp;
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onSelect(priceId)}
        disabled={!!loading}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-6',
          isPro
            ? 'bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-60'
            : `${plan.bgColor} ${plan.color} border ${plan.borderColor} hover:opacity-80 disabled:opacity-60`
        )}
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" />Redirection…</>
          : <><ArrowRight className="w-4 h-4" />Essayer 14 jours gratuits</>
        }
      </button>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={cn(
            'flex items-start gap-2.5 text-xs',
            f.included
              ? isPro ? 'text-white' : 'text-gray-700'
              : isPro ? 'text-blue-300 line-through' : 'text-gray-300 line-through'
          )}>
            <Check className={cn(
              'w-3.5 h-3.5 mt-0.5 flex-shrink-0',
              f.included
                ? isPro ? 'text-white' : 'text-green-500'
                : 'opacity-30'
            )} />
            {f.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Toggle mensuel / annuel ───────────────────────────────────

function BillingToggle({ interval, onChange }: {
  interval: Interval
  onChange:  (v: Interval) => void
}) {
  const isMonthly = interval === 'monthly'

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Label Mensuel */}
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'text-sm transition-colors',
          isMonthly
            ? 'font-bold'
            : 'font-medium text-gray-400 hover:text-gray-600'
        )}
        style={{ color: isMonthly ? 'var(--rp-navy)' : undefined }}
      >
        Mensuel
      </button>

      {/* Toggle pill */}
      <button
        type="button"
        onClick={() => onChange(isMonthly ? 'annual' : 'monthly')}
        className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
        style={{ background: isMonthly ? '#D1D5DB' : 'var(--rp-amber)' }}
        aria-label="Basculer mensuel / annuel"
      >
        <span
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
          style={{ transform: isMonthly ? 'translateX(4px)' : 'translateX(28px)' }}
        />
      </button>

      {/* Label Annuel + badge */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange('annual')}
          className={cn(
            'text-sm transition-colors',
            !isMonthly
              ? 'font-bold'
              : 'font-medium text-gray-400 hover:text-gray-600'
          )}
          style={{ color: !isMonthly ? 'var(--rp-navy)' : undefined }}
        >
          Annuel
        </button>
        <span
          className="px-2.5 py-0.5 text-xs font-bold rounded-full whitespace-nowrap"
          style={{ background: 'var(--rp-amber-light)', color: 'var(--rp-amber-dark)' }}
        >
          Économisez 20 %
        </span>
      </div>
    </div>
  )
}

// ── Bannière abonnement requis ────────────────────────────────

function SubscriptionBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('reason') !== 'subscription_required') return null

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 max-w-2xl mx-auto">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-900">
          Votre période d&rsquo;essai est terminée.
        </p>
        <p className="text-sm text-amber-700 mt-0.5">
          Choisissez un plan pour continuer à utiliser RestoPilot et accéder à toutes vos données.
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function PricingPage() {
  const router   = useRouter()
  // Mensuel sélectionné par défaut
  const [interval, setInterval] = useState<Interval>('monthly')
  const [loading,  setLoading]  = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSelect = async (priceId: string) => {
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
      if (json.url) {
        window.location.href = json.url
        return
      }
      setApiError(json.error ?? 'Une erreur est survenue. Veuillez réessayer.')
    } catch {
      setApiError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      {/* Bannière abonnement requis */}
      <Suspense fallback={null}>
        <SubscriptionBanner />
      </Suspense>

      {/* Erreur API checkout */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-red-200 bg-red-50 max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* En-tête */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium">
          <Zap className="w-3.5 h-3.5" />
          14 jours d&rsquo;essai gratuit — sans engagement
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
          Un prix simple.<br />Toute la gestion de votre restaurant.
        </h1>
        <p className="text-lg text-gray-500">
          Arrêtez les tableurs Excel et les logiciels éparpillés.
          RestoPilot centralise stocks, planning et comptabilité.
        </p>
      </div>

      {/* Toggle mensuel / annuel */}
      <BillingToggle interval={interval} onChange={setInterval} />

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            onSelect={handleSelect}
            loading={loading}
          />
        ))}
      </div>

      {/* Garanties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {[
          { icon: '🔒', title: 'Sans engagement',     desc: 'Annulez à tout moment depuis votre espace client.' },
          { icon: '💳', title: 'Paiement sécurisé',   desc: 'CB collectée à la souscription, débit après les 14 jours d\'essai.' },
          { icon: '🇫🇷', title: 'Hébergé en Europe',  desc: 'Données stockées sur des serveurs européens (RGPD).' },
        ].map(g => (
          <div key={g.title} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
            <div className="text-2xl mb-2">{g.icon}</div>
            <p className="text-sm font-semibold text-gray-900">{g.title}</p>
            <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <h2 className="text-xl font-bold text-gray-900 text-center">Questions fréquentes</h2>
        {[
          {
            q: "Que se passe-t-il après les 14 jours d'essai ?",
            a: "Vous recevez un email de rappel 3 jours avant la fin de l'essai. Votre carte bancaire est débitée automatiquement au démarrage de l'abonnement.",
          },
          {
            q: "Puis-je changer de plan en cours d'abonnement ?",
            a: "Oui, à tout moment depuis votre espace client. Le changement est pris en compte immédiatement avec un prorata calculé automatiquement par Stripe.",
          },
          {
            q: "Mes données sont-elles supprimées si j'annule ?",
            a: "Non. Vos données sont conservées 90 jours après l'annulation, le temps de les exporter si nécessaire.",
          },
        ].map((faq, i) => (
          <details key={i} className="bg-white border border-gray-200 rounded-xl p-4 group">
            <summary className="text-sm font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
              {faq.q}
              <span className="text-gray-400 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
