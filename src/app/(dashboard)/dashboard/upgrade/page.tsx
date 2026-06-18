'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import {
  Zap, Check, ArrowRight, Loader2, X, Star, CheckCircle2, AlertTriangle,
} from 'lucide-react'

// ── Features débloquées en Pro ────────────────────────────────

const PRO_FEATURES = [
  { icon: '🔗', text: 'Intégrations Lightspeed, Tiller et Zelty' },
  { icon: '⚡', text: 'Synchronisation automatique des ventes chaque nuit' },
  { icon: '👥', text: 'Planning illimité — tous vos employés' },
  { icon: '📊', text: 'Export FEC pour votre expert-comptable' },
  { icon: '🤖', text: 'Scan de factures par IA (OCR)' },
  { icon: '📈', text: 'Rapports financiers avancés' },
  { icon: '🎯', text: 'Support prioritaire réponse < 4 heures' },
]

// ── État "paiement en cours d'activation" ─────────────────────

function PaymentActivating() {
  const router  = useRouter()
  const [dots,  setDots]  = useState('.')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(dotTimer)
  }, [])

  useEffect(() => {
    let cancelled = false
    let attempts  = 0
    const MAX     = 20

    const poll = async () => {
      if (cancelled) return
      attempts++
      try {
        const res = await fetch('/api/stripe/status')
        if (res.ok) {
          const data = await res.json()
          if (data?.status === 'active' || data?.status === 'trialing') {
            if (!cancelled) router.push('/dashboard')
            return
          }
        }
      } catch { /* réseau temporairement indisponible */ }

      if (!cancelled && attempts < MAX) {
        setTimeout(poll, 2000)
      } else if (!cancelled) {
        setError('L\'activation est plus longue que prévu. Actualisez la page ou contactez le support.')
      }
    }

    const t = setTimeout(poll, 2000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-md w-full p-8 space-y-6 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Activation en cours</h1>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            Actualiser la page
          </button>
          <a href="/dashboard/compte" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Voir mon compte
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-md w-full p-8 space-y-6 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Paiement confirmé !</h1>
          <p className="text-sm text-gray-500 mt-2">
            Votre abonnement est en cours d&rsquo;activation{dots}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Vous serez redirigé automatiquement vers votre tableau de bord.
        </div>
      </div>
    </div>
  )
}

// ── Contenu principal (upgrade CTA) ──────────────────────────

function UpgradeContent() {
  const searchParams    = useSearchParams()
  const router          = useRouter()
  const isPaymentSuccess = searchParams.get('payment') === 'success'
  const feature         = searchParams.get('feature') ?? 'cette fonctionnalité'
  const priceIdPro      = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? 'price_pro_monthly'

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  if (isPaymentSuccess) return <PaymentActivating />

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId: priceIdPro }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setError(json.error ?? 'Erreur lors de la création de la session')
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
            <Star className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Fonctionnalité Pro
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              <strong className="text-gray-700">{feature}</strong> est disponible
              à partir du plan Pro.
            </p>
          </div>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ce que vous débloquez</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Features */}
        <ul className="space-y-2.5">
          {PRO_FEATURES.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-base">{f.icon}</span>
              <span>{f.text}</span>
              <Check className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0" />
            </li>
          ))}
        </ul>

        {/* Prix */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl font-extrabold text-blue-700">79€</span>
            <span className="text-sm text-blue-500 pb-1">/mois</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">Essai 14 jours gratuit · Sans engagement</p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Redirection vers Stripe…</>
              : <><Zap className="w-4 h-4" />Passer au plan Pro<ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <button
            onClick={() => router.back()}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page avec Suspense (useSearchParams nécessite un boundary) ─

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
