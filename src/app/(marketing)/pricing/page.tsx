'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, Zap, Star, Building2, ArrowRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type Interval = 'monthly' | 'annual'

type PlanFeature = { text: string; included: boolean }

type Plan = {
  id:           'starter' | 'pro' | 'multi'
  name:         string
  description:  string
  monthlyPrice: number
  annualPrice:  number
  priceIdMonthly: string
  priceIdAnnual:  string
  icon:         React.ReactNode
  color:        string
  bgColor:      string
  borderColor:  string
  badge?:       string
  features:     PlanFeature[]
}

// ── Données des plans ─────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id:           'starter',
    name:         'Starter',
    description:  'Idéal pour démarrer et structurer votre gestion.',
    monthlyPrice:  49,
    annualPrice:   39,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? 'price_starter_monthly',
    priceIdAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL  ?? 'price_starter_annual',
    icon:   <Zap className="w-5 h-5" />,
    color:  'text-blue-700',
    bgColor:     'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      { text: '1 restaurant',                      included: true  },
      { text: 'Tableau de bord financier',          included: true  },
      { text: 'Gestion des stocks & inventaires',   included: true  },
      { text: 'Planning (jusqu\'à 10 employés)',    included: true  },
      { text: 'Import CSV des ventes',              included: true  },
      { text: 'Rapport hebdomadaire par email',     included: true  },
      { text: 'Support par email',                  included: true  },
      { text: 'Intégrations caisses (Lightspeed…)', included: false },
      { text: 'Synchronisation automatique',        included: false },
      { text: 'Export FEC comptable',               included: false },
      { text: 'Scan de factures par IA',            included: false },
    ],
  },
  {
    id:           'pro',
    name:         'Pro',
    description:  'Tout automatisé pour les restaurateurs actifs.',
    monthlyPrice:  79,
    annualPrice:   63,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? 'price_pro_monthly',
    priceIdAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL  ?? 'price_pro_annual',
    badge:        'Le plus populaire',
    icon:   <Star className="w-5 h-5" />,
    color:  'text-white',
    bgColor:     'bg-blue-600',
    borderColor: 'border-blue-600',
    features: [
      { text: '1 restaurant',                       included: true },
      { text: 'Tout Starter',                       included: true },
      { text: 'Intégrations caisses (Lightspeed, Tiller, Zelty)', included: true },
      { text: 'Synchronisation automatique des ventes', included: true },
      { text: 'Planning illimité (employés illimités)', included: true },
      { text: 'Export FEC comptable',                included: true },
      { text: 'Scan de factures par IA (OCR)',       included: true },
      { text: 'Rapports financiers avancés',         included: true },
      { text: 'Support prioritaire (< 4h)',          included: true },
      { text: 'Dashboard multi-sites',               included: false },
      { text: 'Accès multi-utilisateurs',            included: false },
    ],
  },
  {
    id:           'multi',
    name:         'Multi-sites',
    description:  'Pour les groupes et franchises multi-restaurants.',
    monthlyPrice:  149,
    annualPrice:   119,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_MONTHLY ?? 'price_multi_monthly',
    priceIdAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI_ANNUAL  ?? 'price_multi_annual',
    icon:   <Building2 className="w-5 h-5" />,
    color:  'text-purple-700',
    bgColor:     'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      { text: 'Jusqu\'à 5 restaurants',             included: true },
      { text: 'Tout Pro',                           included: true },
      { text: 'Dashboard consolidé multi-sites',    included: true },
      { text: '5 utilisateurs inclus',              included: true },
      { text: 'Rapports croisés entre sites',       included: true },
      { text: 'API dédiée avec rate-limit élevé',   included: true },
      { text: 'Account manager dédié',              included: true },
      { text: 'SLA 99,9 % (uptime garanti)',        included: true },
      { text: 'Formation & onboarding personnalisé',included: true },
      { text: 'Facturation centralisée',            included: true },
      { text: 'Intégrations sur mesure',            included: true },
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
  const isPro    = plan.id === 'pro'
  const price    = interval === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const priceId  = interval === 'monthly' ? plan.priceIdMonthly : plan.priceIdAnnual
  const isLoading = loading === priceId

  return (
    <div className={cn(
      'relative rounded-2xl border-2 p-6 flex flex-col transition-all',
      isPro
        ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 scale-[1.02]'
        : `bg-white ${plan.borderColor} hover:shadow-md`
    )}>
      {/* Badge */}
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
            {price}€
          </span>
          <span className={cn('text-sm pb-1', isPro ? 'text-blue-100' : 'text-gray-400')}>
            /mois
          </span>
        </div>
        {interval === 'annual' && (
          <p className={cn('text-xs mt-0.5', isPro ? 'text-blue-100' : 'text-green-600 font-medium')}>
            Facturé {price * 12}€/an · économisez {(plan.monthlyPrice - price) * 12}€
          </p>
        )}
      </div>

      {/* CTA */}
      <button
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

// ── Page ──────────────────────────────────────────────────────

export default function PricingPage() {
  const router              = useRouter()
  const [interval, setInt]  = useState<Interval>('monthly')
  const [loading,  setLoad] = useState<string | null>(null)

  const handleSelect = async (priceId: string) => {
    setLoad(priceId)
    try {
      // Tenter la création de session si authentifié, sinon aller à l'inscription
      const res = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId }),
      })

      if (res.status === 401) {
        // Pas connecté → inscription avec le priceId en paramètre
        router.push(`/register?priceId=${encodeURIComponent(priceId)}`)
        return
      }

      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      router.push(`/register?priceId=${encodeURIComponent(priceId)}`)
    } finally {
      setLoad(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      {/* En-tête */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium">
          <Zap className="w-3.5 h-3.5" />
          14 jours d&rsquo;essai gratuit — sans CB
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
      <div className="flex items-center justify-center gap-3">
        <span className={cn('text-sm font-medium', interval === 'monthly' ? 'text-gray-900' : 'text-gray-400')}>
          Mensuel
        </span>
        <button
          onClick={() => setInt(i => i === 'monthly' ? 'annual' : 'monthly')}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            interval === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
          )}
          aria-label="Basculer vers annuel"
        >
          <span className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
            interval === 'annual' ? 'translate-x-7' : 'translate-x-1'
          )} />
        </button>
        <span className={cn('text-sm font-medium', interval === 'annual' ? 'text-gray-900' : 'text-gray-400')}>
          Annuel
        </span>
        {interval === 'annual' && (
          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            −20 %
          </span>
        )}
      </div>

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
          { icon: '🔒', title: 'Sans engagement',  desc: 'Annulez à tout moment depuis votre espace client.' },
          { icon: '💳', title: 'Sans CB pour l\'essai', desc: 'Testez 14 jours sans entrer votre carte bancaire.' },
          { icon: '🇫🇷', title: 'Hébergé en France', desc: 'Données stockées sur des serveurs européens (RGPD).' },
        ].map(g => (
          <div key={g.title} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
            <div className="text-2xl mb-2">{g.icon}</div>
            <p className="text-sm font-semibold text-gray-900">{g.title}</p>
            <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ minimaliste */}
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <h2 className="text-xl font-bold text-gray-900 text-center">Questions fréquentes</h2>
        {[
          {
            q: 'Que se passe-t-il après les 14 jours d\'essai ?',
            a: 'Vous recevez un email de rappel 3 jours avant la fin de l\'essai. Sans CB enregistrée, votre compte passe en lecture seule. Avec CB, votre abonnement démarre automatiquement.',
          },
          {
            q: 'Puis-je changer de plan en cours d\'abonnement ?',
            a: 'Oui, à tout moment depuis votre espace client. Le changement est pris en compte immédiatement avec un prorata calculé automatiquement par Stripe.',
          },
          {
            q: 'Mes données sont-elles supprimées si j\'annule ?',
            a: 'Non. Vos données sont conservées 90 jours après l\'annulation, le temps de les exporter si nécessaire.',
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
