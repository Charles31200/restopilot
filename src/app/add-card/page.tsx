'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, ShieldCheck, Lock } from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'

// Mapping plan → price ID mensuel (identique à onboarding-payment)
const PLAN_TO_PRICE: Record<string, string> = {
  starter: 'price_1TjRUOEw9od5qGxlnDbe4Nqv',
  pro:     'price_1TjRUvEw9od5qGxl9yxWt6JO',
  multi:   'price_1TjRWjEw9od5qGxlAzYYrIqd',
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro:     'Pro',
  multi:   'Multi',
}

export default function AddCardPage() {
  const router = useRouter()
  const [plan,       setPlan]       = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [signing,    setSigning]    = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Récupérer le plan actuel de l'utilisateur
  useEffect(() => {
    fetch('/api/stripe/payment-method')
      .then(r => r.json())
      .then(data => {
        if (data.plan) setPlan(data.plan)
        // Si la carte est déjà enregistrée, rediriger vers le dashboard
        if (data.has_payment_method === true) router.replace('/dashboard')
      })
      .catch(() => setFetchError('Impossible de charger les informations.'))
  }, [router])

  const handleAddCard = async () => {
    if (!plan) return
    setLoading(true)
    setFetchError(null)

    const priceId = PLAN_TO_PRICE[plan] ?? PLAN_TO_PRICE['starter']

    try {
      const res  = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setFetchError(data.error ?? 'Une erreur est survenue.')
        setLoading(false)
      }
    } catch {
      setFetchError('Une erreur est survenue.')
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setSigning(true)
    document.cookie = 'remember_session=; path=/; max-age=0'
    localStorage.removeItem('pilotresto-session')
    await signOutAction()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: '#0D1B1E' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-[24px] overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ borderBottom: '1px solid #F0EEF7' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="PilotResto"
            style={{ height: '48px', width: 'auto', margin: '0 auto 16px' }}
          />
          <h1
            className="text-[22px] font-bold leading-snug"
            style={{ color: '#0D1B1E', fontFamily: 'var(--font-display)' }}
          >
            Une carte bancaire est requise
          </h1>
          <p
            className="mt-2 text-[14px] leading-relaxed"
            style={{ color: '#6B7280', fontFamily: 'var(--font-body)' }}
          >
            {plan
              ? <>Votre essai <strong>{PLAN_LABELS[plan] ?? plan}</strong> est prêt.</>
              : 'Votre essai est prêt.'
            }{' '}
            Ajoutez une carte pour l&apos;activer — vous ne serez pas débité avant la fin des 14 jours d&apos;essai.
          </p>
        </div>

        {/* Garanties */}
        <div className="px-8 py-5" style={{ borderBottom: '1px solid #F0EEF7' }}>
          {[
            { icon: ShieldCheck, text: 'Annulable à tout moment, sans frais' },
            { icon: Lock,        text: 'Paiement sécurisé via Stripe' },
            { icon: CreditCard,  text: 'Aucun débit pendant 14 jours' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 py-2">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#D4952A' }} />
              <span className="text-[13px]" style={{ color: '#374151', fontFamily: 'var(--font-body)' }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Erreur */}
        {fetchError && (
          <div className="mx-8 mt-5 p-3 rounded-[12px] text-[13px] text-red-700 bg-red-50">
            {fetchError}
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pt-5 pb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAddCard}
            disabled={loading || !plan}
            className="w-full h-[52px] rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{
              background:  '#0D1B1E',
              color:       '#fff',
              fontFamily:  'var(--font-display)',
              boxShadow:   '0 3px 12px rgba(13,27,30,.35)',
            }}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" />Redirection vers Stripe…</>
              : <><CreditCard size={16} />Ajouter ma carte bancaire</>
            }
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signing}
            className="text-[13px] text-center transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ color: '#9CA3AF', fontFamily: 'var(--font-body)' }}
          >
            {signing ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
        PilotResto · Essai gratuit 14 jours · Aucun engagement
      </p>
    </div>
  )
}
