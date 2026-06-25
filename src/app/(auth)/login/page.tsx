'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { signInAction } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

// ── Helpers OAuth ─────────────────────────────────────────────

const CALLBACK_URL = 'https://restopilot.pro/api/auth/callback'

// ── Page ──────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPwd,       setShowPwd]       = useState(false)
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading,  setAppleLoading]  = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const emailVal = watch('email')    ?? ''
  const pwdVal   = watch('password') ?? ''

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const result = await signInAction(data.email, data.password)
    if (result && 'error' in result) setServerError(result.error)
  }

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

  const socialDisabled = googleLoading || appleLoading || isSubmitting

  return (
    <div className="min-h-screen flex flex-col px-5" style={{ background: 'var(--rp-bg-page)' }}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center" style={{ paddingTop: '12vh', paddingBottom: '6vh' }}>
        <img src="/favicon.png" alt="PilotResto" style={{ height: '64px', width: 'auto', marginBottom: '12px' }} />
        <p className="text-[14px] text-center leading-relaxed" style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
          Gérez votre restaurant en 10 secondes
        </p>
      </div>

      {/* ── Formulaire ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col max-w-sm w-full mx-auto">

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
        <div className="relative flex items-center mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--rp-lavender-light)' }} />
          <span className="px-3 text-[12px] uppercase tracking-widest" style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'var(--rp-lavender-light)' }} />
        </div>

        {/* Erreur serveur */}
        {serverError && (
          <div className="flex items-start gap-2.5 p-3 rounded-[12px] mb-4 text-[14px]" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">

          {/* Email */}
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              {...register('email')}
              className={cn(
                'peer w-full h-[52px] px-4 pt-5 pb-2 text-[15px] rounded-[14px] outline-none transition-all bg-white',
                errors.email ? 'border-2 border-rp-danger' : 'border border-rp-lavender focus:border-2 focus:border-rp-amber'
              )}
              style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-body)' }}
            />
            <label htmlFor="email" className={cn(
              'absolute left-4 pointer-events-none select-none transition-all duration-200',
              'peer-placeholder-shown:top-[50%] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
              'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px]',
              emailVal.length > 0 && 'top-2.5 translate-y-0 text-[11px]',
            )} style={{ color: errors.email ? 'var(--rp-danger)' : 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
              Adresse email
            </label>
            {errors.email && <p className="mt-1.5 text-[12px] flex items-center gap-1" style={{ color: 'var(--rp-danger)' }}><AlertCircle size={12} />{errors.email.message}</p>}
          </div>

          {/* Mot de passe */}
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder=" "
              {...register('password')}
              className={cn(
                'peer w-full h-[52px] px-4 pt-5 pb-2 pr-12 text-[15px] rounded-[14px] outline-none transition-all bg-white',
                errors.password ? 'border-2 border-rp-danger' : 'border border-rp-lavender focus:border-2 focus:border-rp-amber'
              )}
              style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-body)' }}
            />
            <label htmlFor="password" className={cn(
              'absolute left-4 pointer-events-none select-none transition-all duration-200',
              'peer-placeholder-shown:top-[50%] peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px]',
              'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px]',
              pwdVal.length > 0 && 'top-2.5 translate-y-0 text-[11px]',
            )} style={{ color: errors.password ? 'var(--rp-danger)' : 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center"
              style={{ color: 'var(--rp-navy-muted)' }}
              tabIndex={-1}
              aria-label={showPwd ? 'Masquer' : 'Afficher'}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="mt-1.5 text-[12px] flex items-center gap-1" style={{ color: 'var(--rp-danger)' }}><AlertCircle size={12} />{errors.password.message}</p>}
          </div>

          {/* Mot de passe oublié */}
          <div className="flex justify-center">
            <Link href="/forgot-password" className="text-[14px] font-medium" style={{ color: 'var(--rp-blue)', fontFamily: 'var(--font-body)' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={isSubmitting || socialDisabled}
            className="w-full h-[56px] rounded-full font-semibold text-[16px] flex items-center justify-center gap-2 mt-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--rp-amber)', color: '#fff', fontFamily: 'var(--font-display)', boxShadow: '0 3px 12px rgba(212,149,42,.35)' }}
          >
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" />Connexion…</> : 'Se connecter'}
          </button>
        </form>

        {/* Créer un compte */}
        <p className="text-center text-[14px] mt-5 mb-8" style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}>
            Créer un compte gratuit
          </Link>
        </p>
      </div>
    </div>
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
