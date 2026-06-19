'use client'

import { useState }              from 'react'
import Link                      from 'next/link'
import { useForm }               from 'react-hook-form'
import { zodResolver }           from '@hookform/resolvers/zod'
import { z }                     from 'zod'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signUpAction }          from '@/lib/supabase/actions'
import { createClient }          from '@/lib/supabase/client'
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

// ── Helpers ───────────────────────────────────────────────────

const CALLBACK_URL = 'https://restopilot.pro/api/auth/callback'

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
  const [serverInfo,   setServerInfo]   = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading,  setAppleLoading]  = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const pwValue    = watch('password', '')
  const pwStrength = getPasswordStrength(pwValue)

  const handleOAuth = async (provider: 'google' | 'apple') => {
    const setLoading = provider === 'google' ? setGoogleLoading : setAppleLoading
    setLoading(true)
    setServerError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: CALLBACK_URL,
          ...(provider === 'google'
            ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
            : {}),
        },
      })
      if (error) {
        setServerError(`Connexion ${provider === 'google' ? 'Google' : 'Apple'} impossible.`)
        setLoading(false)
      }
    } catch {
      setServerError('Une erreur est survenue.')
      setLoading(false)
    }
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    setServerInfo(null)
    const result = await signUpAction(data.email, data.password)
    if (result && 'error' in result)   setServerError(result.error)
    if (result && 'message' in result) setServerInfo(result.message)
  }

  const socialDisabled = googleLoading || appleLoading || isSubmitting

  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-6">
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

      {/* Bouton Google */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={socialDisabled}
        className="w-full h-[52px] flex items-center justify-center gap-3 rounded-[14px] font-medium text-[15px] mb-3 transition-opacity disabled:opacity-60"
        style={{ background: 'var(--rp-white)', border: '1px solid var(--rp-lavender)', color: 'var(--rp-navy)', boxShadow: 'var(--rp-shadow-card)', fontFamily: 'var(--font-body)' }}
      >
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
        Continuer avec Google
      </button>

      {/* Bouton Apple */}
      <button
        type="button"
        onClick={() => handleOAuth('apple')}
        disabled={socialDisabled}
        className="w-full h-[52px] flex items-center justify-center gap-3 rounded-[14px] font-medium text-[15px] mb-5 transition-opacity disabled:opacity-60"
        style={{ background: '#000', border: '1px solid #000', color: '#fff', boxShadow: 'var(--rp-shadow-card)', fontFamily: 'var(--font-body)' }}
      >
        {appleLoading ? <Loader2 size={18} className="animate-spin" /> : <AppleIcon />}
        Continuer avec Apple
      </button>

      {/* Séparateur ou */}
      <div className="relative flex items-center mb-5">
        <div className="flex-1 h-px" style={{ background: 'var(--rp-lavender-light)' }} />
        <span className="px-3 text-[12px] uppercase tracking-widest" style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'var(--rp-lavender-light)' }} />
      </div>

      {/* Message de confirmation email */}
      {serverInfo && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2"
          style={{ background: 'var(--rp-amber-light)', color: 'var(--rp-amber-dark)', border: '1px solid var(--rp-amber)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {serverInfo}
        </div>
      )}

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
          disabled={isSubmitting || socialDisabled}
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

// ── Icônes ────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
      <path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
    </svg>
  )
}
