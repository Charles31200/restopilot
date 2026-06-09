'use client'

import { useState }              from 'react'
import Link                      from 'next/link'
import { useForm }               from 'react-hook-form'
import { zodResolver }           from '@hookform/resolvers/zod'
import { z }                     from 'zod'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signUpAction }          from '@/lib/supabase/actions'
import { cn }                    from '@/lib/utils/cn'

// ── Schéma ────────────────────────────────────────────────────

const schema = z
  .object({
    email:           z.string().min(1, 'Email requis').email('Adresse email invalide'),
    password:        z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ── Indicateur de force du mot de passe ──────────────────────

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8)          score++
  if (pw.length >= 12)         score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-green-600']
  const idx = Math.max(0, score - 1)
  return { score, label: labels[idx], color: colors[idx] }
}

// ── Composant ─────────────────────────────────────────────────

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [serverError,  setServerError]  = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const pwValue   = watch('password', '')
  const pwStrength = getPasswordStrength(pwValue)

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await signUpAction(data.email, data.password)
    if (result?.error) setServerError(result.error)
  }

  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1
          className="text-[22px] font-bold"
          style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
        >
          Créer votre compte
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: 'var(--rp-navy-muted)' }}>
          Essai gratuit 14 jours · Sans carte bancaire
        </p>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Email */}
        <div className="relative">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder=" "
            className={cn(
              'peer w-full h-[52px] rounded-[14px] border bg-white px-4 pt-5 pb-2 text-[15px] outline-none transition-all focus:ring-2',
              errors.email
                ? 'border-red-400 text-red-700 focus:border-red-400 focus:ring-red-100'
                : 'border-[var(--rp-lavender)] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20'
            )}
            {...register('email')}
          />
          <label
            htmlFor="email"
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all text-[15px]',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
              'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[var(--rp-amber)]',
              errors.email ? 'text-red-500' : 'text-[var(--rp-navy-muted)]',
            )}
          >
            Adresse email
          </label>
          {errors.email && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.email.message}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder=" "
              className={cn(
                'peer w-full h-[52px] rounded-[14px] border bg-white px-4 pt-5 pb-2 pr-12 text-[15px] outline-none transition-all focus:ring-2',
                errors.password
                  ? 'border-red-400 text-red-700 focus:border-red-400 focus:ring-red-100'
                  : 'border-[var(--rp-lavender)] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20'
              )}
              {...register('password')}
            />
            <label
              htmlFor="password"
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all text-[15px]',
                'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
                'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[var(--rp-amber)]',
                errors.password ? 'text-red-500' : 'text-[var(--rp-navy-muted)]',
              )}
            >
              Mot de passe
            </label>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--rp-navy-muted)' }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Jauge de force */}
          {pwValue.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn('h-1 flex-1 rounded-full transition-colors duration-300',
                      i < pwStrength.score ? pwStrength.color : 'bg-gray-200')}
                  />
                ))}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--rp-navy-muted)' }}>
                Force : <span className="font-medium">{pwStrength.label}</span>
              </p>
            </div>
          )}
          {errors.password && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmation */}
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder=" "
            className={cn(
              'peer w-full h-[52px] rounded-[14px] border bg-white px-4 pt-5 pb-2 pr-12 text-[15px] outline-none transition-all focus:ring-2',
              errors.confirmPassword
                ? 'border-red-400 text-red-700 focus:border-red-400 focus:ring-red-100'
                : 'border-[var(--rp-lavender)] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20'
            )}
            {...register('confirmPassword')}
          />
          <label
            htmlFor="confirmPassword"
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-all text-[15px]',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
              'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[var(--rp-amber)]',
              errors.confirmPassword ? 'text-red-500' : 'text-[var(--rp-navy-muted)]',
            )}
          >
            Confirmer le mot de passe
          </label>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--rp-navy-muted)' }}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {errors.confirmPassword && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* CGU */}
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--rp-navy-muted)' }}>
          En créant un compte, vous acceptez nos{' '}
          <a href="/cgu" className="underline hover:opacity-70">Conditions d&apos;utilisation</a>{' '}
          et notre{' '}
          <a href="/confidentialite" className="underline hover:opacity-70">Politique de confidentialité</a>.
        </p>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full h-[56px] rounded-full font-semibold text-[15px] text-white',
            'flex items-center justify-center gap-2 transition active:scale-[0.98]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
          style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
        </button>

      </form>

      {/* Lien connexion */}
      <p className="text-center text-[13px] mt-6" style={{ color: 'var(--rp-navy-muted)' }}>
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-semibold hover:underline transition-colors"
          style={{ color: 'var(--rp-amber)' }}
        >
          Se connecter
        </Link>
      </p>
    </>
  )
}
