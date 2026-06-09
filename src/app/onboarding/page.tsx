'use client'

/**
 * Onboarding — affiché une seule fois après la création de compte.
 * Étape 1 : Informations restaurant (nom, adresse, SIRET)
 * Étape 2 : Profil personnel (prénom, nom)
 * Proxy : redirige vers /onboarding si first_name est NULL en base.
 */

import { useState }              from 'react'
import { useForm }               from 'react-hook-form'
import { zodResolver }           from '@hookform/resolvers/zod'
import { z }                     from 'zod'
import { Loader2, AlertCircle }  from 'lucide-react'
import { cn }                    from '@/lib/utils/cn'
import { updateOnboardingAction } from '@/lib/supabase/actions'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  restaurantName:    z.string().min(2, 'Minimum 2 caractères'),
  restaurantAddress: z.string().optional(),
  restaurantSiret:   z.string().optional(),
  firstName:         z.string().min(1, 'Prénom requis'),
  lastName:          z.string().min(1, 'Nom requis'),
})

type FormData = z.infer<typeof schema>

// ── FloatingInput ─────────────────────────────────────────────

type FloatingInputProps = {
  id:       string
  label:    string
  error?:   string
} & React.InputHTMLAttributes<HTMLInputElement>

function FloatingInput({ id, label, error, className, ...props }: FloatingInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          className={cn(
            'peer w-full h-[52px] rounded-[14px] border bg-white',
            'px-4 pt-5 pb-2 text-[15px] outline-none transition-all',
            'focus:ring-2',
            error
              ? 'border-red-400 text-red-700 focus:border-red-400 focus:ring-red-100'
              : 'border-[var(--rp-lavender)] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20',
            className,
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all text-[15px]',
            // Flotte vers le haut quand le champ est rempli ou en focus
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
            'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[var(--rp-amber)]',
            '[&:not(:placeholder-shown)]:top-3',
            error ? 'text-red-500' : 'text-[var(--rp-navy-muted)]',
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step,        setStep]        = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Étape 1 → 2 : valider uniquement les champs de l'étape 1
  async function goToStep2() {
    const valid = await trigger(['restaurantName'])
    if (valid) setStep(2)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)
    const result = await updateOnboardingAction(
      { name: data.restaurantName, address: data.restaurantAddress, siret: data.restaurantSiret },
      { first_name: data.firstName, last_name: data.lastName },
    )
    // Si l'action renvoie une erreur → afficher ; sinon le redirect() côté serveur navigue
    if (result?.error) {
      setServerError(result.error)
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--rp-bg-page)' }}
    >
      <div className="w-full max-w-[400px]">

        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-4"
            style={{ background: 'var(--rp-navy)' }}
          >
            <span
              className="text-2xl font-black"
              style={{ color: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
            >
              RP
            </span>
          </div>
          <h1
            className="text-[22px] font-bold text-center"
            style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
          >
            {step === 1 ? 'Votre restaurant' : 'Votre profil'}
          </h1>
          <p
            className="text-[13px] text-center mt-1"
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            {step === 1
              ? 'Configurez votre établissement'
              : 'Quelques informations sur vous'}
          </p>
        </div>

        {/* ── Indicateur de progression ─────────────────────── */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div
              key={s}
              className="h-[6px] rounded-full transition-all duration-300"
              style={{
                width:      s === step ? 28 : 8,
                background: s <= step ? 'var(--rp-amber)' : 'var(--rp-lavender)',
              }}
            />
          ))}
        </div>

        {/* ── Carte formulaire ──────────────────────────────── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{
            border:     '1px solid var(--rp-lavender-light)',
            boxShadow:  'var(--rp-shadow-card)',
          }}
        >
          {/* Erreur serveur */}
          {serverError && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2"
              style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Étape 1 : Restaurant ─────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <FloatingInput
                  id="restaurantName"
                  label="Nom du restaurant *"
                  error={errors.restaurantName?.message}
                  {...register('restaurantName')}
                />
                <FloatingInput
                  id="restaurantAddress"
                  label="Adresse (optionnel)"
                  error={errors.restaurantAddress?.message}
                  {...register('restaurantAddress')}
                />
                <FloatingInput
                  id="restaurantSiret"
                  label="SIRET (optionnel)"
                  error={errors.restaurantSiret?.message}
                  {...register('restaurantSiret')}
                />

                <button
                  type="button"
                  onClick={goToStep2}
                  className="mt-2 w-full h-[56px] rounded-full font-semibold text-[15px] text-white transition active:scale-[0.98]"
                  style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
                >
                  Continuer →
                </button>
              </div>
            )}

            {/* ── Étape 2 : Profil ─────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <FloatingInput
                  id="firstName"
                  label="Prénom *"
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <FloatingInput
                  id="lastName"
                  label="Nom *"
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'mt-2 w-full h-[56px] rounded-full font-semibold text-[15px] text-white',
                    'flex items-center justify-center gap-2 transition active:scale-[0.98]',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                  )}
                  style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Enregistrement…' : 'Accéder au tableau de bord'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center py-2 text-[13px] transition hover:opacity-70"
                  style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
                >
                  ← Retour
                </button>
              </div>
            )}

          </form>
        </div>

        {/* ── Étiquette étape ───────────────────────────────── */}
        <p
          className="text-center mt-4 text-[12px]"
          style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
        >
          Étape {step} sur 2
        </p>

      </div>
    </main>
  )
}
