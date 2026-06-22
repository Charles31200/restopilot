'use client'

import { useState }      from 'react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { Loader2, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  firstName:      z.string().min(1, 'Prénom requis'),
  lastName:       z.string().min(1, 'Nom requis'),
  email:          z.string().email('Email invalide'),
  phone:          z.string().min(6, 'Téléphone requis'),
  restaurantName: z.string().min(1, 'Nom du restaurant requis'),
  city:           z.string().min(1, 'Ville requise'),
  employees:      z.string().min(1, 'Sélectionnez une option'),
  restaurantType: z.string().min(1, 'Sélectionnez un type'),
  message:        z.string().optional(),
  consent:        z.literal(true, { error: 'Veuillez accepter pour continuer' }),
})

type FormData = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────

const labelCls = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500'

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full h-[48px] rounded-xl border px-4 text-[14px] text-gray-900 outline-none transition-all bg-white',
    'focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-amber-500 focus:ring-amber-100',
  )

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
    </p>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function ContactPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setServerError(j.error ?? 'Une erreur est survenue. Réessayez.')
        return
      }
      setSuccess(true)
    } catch {
      setServerError('Erreur réseau. Veuillez réessayer.')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1920&q=80&auto=format&fit=crop)',
        }}
      />
      <div className="fixed inset-0" style={{ background: 'rgba(17,24,39,0.82)' }} />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#D4952A' }}
          >
            <span className="text-white font-bold text-sm select-none">RP</span>
          </div>
          <span className="text-white font-bold text-lg">RestoPilot</span>
        </a>
        <a
          href="/"
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour
        </a>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* Success state */}
          {success ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(212,149,42,0.12)' }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: '#D4952A' }} />
              </div>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ color: '#1B2A4A' }}
              >
                Merci pour votre demande !
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Nous vous contacterons dans les 24h pour organiser votre démo personnalisée.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition active:scale-95"
                style={{ background: '#D4952A' }}
              >
                Retour à l&apos;accueil
              </a>
            </div>
          ) : (

          /* Form card */
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: '#1B2A4A' }}
              >
                Demander une démo
              </h1>
              <p className="text-sm text-gray-400">
                Complétez ce formulaire et nous vous rappelons sous 24h.
              </p>
            </div>

            <div className="px-8 py-7">
              {serverError && (
                <div className="mb-6 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Prénom *</label>
                    <input
                      type="text"
                      placeholder="Jean"
                      className={inputCls(!!errors.firstName)}
                      {...register('firstName')}
                    />
                    <FieldError msg={errors.firstName?.message} />
                  </div>
                  <div>
                    <label className={labelCls}>Nom *</label>
                    <input
                      type="text"
                      placeholder="Dupont"
                      className={inputCls(!!errors.lastName)}
                      {...register('lastName')}
                    />
                    <FieldError msg={errors.lastName?.message} />
                  </div>
                </div>

                {/* Email / Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email professionnel *</label>
                    <input
                      type="email"
                      placeholder="jean@monrestaurant.fr"
                      className={inputCls(!!errors.email)}
                      {...register('email')}
                    />
                    <FieldError msg={errors.email?.message} />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone *</label>
                    <input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className={inputCls(!!errors.phone)}
                      {...register('phone')}
                    />
                    <FieldError msg={errors.phone?.message} />
                  </div>
                </div>

                {/* Restaurant / Ville */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom du restaurant *</label>
                    <input
                      type="text"
                      placeholder="Le Comptoir"
                      className={inputCls(!!errors.restaurantName)}
                      {...register('restaurantName')}
                    />
                    <FieldError msg={errors.restaurantName?.message} />
                  </div>
                  <div>
                    <label className={labelCls}>Ville *</label>
                    <input
                      type="text"
                      placeholder="Lyon"
                      className={inputCls(!!errors.city)}
                      {...register('city')}
                    />
                    <FieldError msg={errors.city?.message} />
                  </div>
                </div>

                {/* Employees / Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nombre d&apos;employés *</label>
                    <select
                      className={inputCls(!!errors.employees)}
                      defaultValue=""
                      {...register('employees')}
                    >
                      <option value="" disabled>Sélectionner…</option>
                      <option value="1-3">1 à 3 employés</option>
                      <option value="4-10">4 à 10 employés</option>
                      <option value="10+">Plus de 10 employés</option>
                    </select>
                    <FieldError msg={errors.employees?.message} />
                  </div>
                  <div>
                    <label className={labelCls}>Type de restaurant *</label>
                    <select
                      className={inputCls(!!errors.restaurantType)}
                      defaultValue=""
                      {...register('restaurantType')}
                    >
                      <option value="" disabled>Sélectionner…</option>
                      <option value="Bistrot / Brasserie">Bistrot / Brasserie</option>
                      <option value="Restaurant gastronomique">Restaurant gastronomique</option>
                      <option value="Restauration rapide">Restauration rapide</option>
                      <option value="Pizzeria">Pizzeria</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <FieldError msg={errors.restaurantType?.message} />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className={labelCls}>Message (optionnel)</label>
                  <textarea
                    rows={3}
                    placeholder="Parlez-nous de vos besoins..."
                    className={cn(inputCls(), 'h-auto py-3 resize-none')}
                    {...register('message')}
                  />
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                    style={{ accentColor: '#D4952A' }}
                    {...register('consent')}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-500 cursor-pointer leading-snug">
                    J&apos;accepte d&apos;être contacté par RestoPilot concernant ma demande.
                  </label>
                </div>
                <FieldError msg={errors.consent?.message} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ background: '#D4952A' }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
                </button>

              </form>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/30 text-xs">
          © 2026 RestoPilot — charles.lecussan@gmail.com
          {' · '}
          <a href="/cgu-cgv" className="hover:text-white/60 transition-colors">CGU/CGV</a>
          {' · '}
          <a href="/politique-de-confidentialite" className="hover:text-white/60 transition-colors">Confidentialité</a>
        </p>
      </footer>

    </div>
  )
}
