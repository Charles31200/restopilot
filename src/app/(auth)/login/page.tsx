'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────

type Mode = 'login' | 'forgot' | 'forgot-sent'

// ── Helpers ───────────────────────────────────────────────────

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed'))        return 'Confirmez votre email avant de vous connecter.'
  if (msg.includes('Too many requests'))          return 'Trop de tentatives. Réessayez dans quelques minutes.'
  return 'Une erreur est survenue. Réessayez.'
}

const RESET_REDIRECT = 'https://restopilot.pro/api/auth/callback?next=/auth/set-password'
const OAUTH_REDIRECT = 'https://restopilot.pro/api/auth/callback'

// ── Composants locaux ─────────────────────────────────────────

function RPInput({
  icon,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-[8px] text-[15px] outline-none transition-colors duration-150 placeholder:text-[rgba(255,255,255,0.3)]"
        style={{
          background:  '#111111',
          border:      '1px solid rgba(255,255,255,0.1)',
          padding:     icon ? '12px 44px 12px 16px' : '12px 16px',
          color:       '#FFFFFF',
          fontFamily:  'var(--font-body)',
          ...style,
        }}
        onFocus={e  => (e.target.style.borderColor = '#7798AB')}
        onBlur={e   => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        {...props}
      />
      {icon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {icon}
        </span>
      )}
    </div>
  )
}

function SubmitBtn({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      className="w-full h-[44px] rounded-[8px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1 hover:opacity-90"
      style={{ background: '#7798AB', color: '#fff', fontFamily: 'var(--font-display)' }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="mb-3 p-3 rounded-[10px] text-[13px]" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', fontFamily: 'var(--font-body)' }}>
      {msg}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()

  const [mode,          setMode]         = useState<Mode>('login')
  const [email,         setEmail]        = useState('')
  const [password,      setPassword]     = useState('')
  const [showPwd,       setShowPwd]      = useState(false)
  const [rememberMe,    setRememberMe]   = useState(false)
  const [forgotEmail,   setForgotEmail]  = useState('')
  const [error,         setError]        = useState<string | null>(null)
  const [loading,       setLoading]      = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Pose le cookie pwa_installed si ouverte depuis la PWA / Electron
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('source') === 'pwa' || params.get('source') === 'electron') {
      document.cookie = 'pwa_installed=true; path=/; max-age=31536000; SameSite=Lax'
    }
  }, [])

  // Session existante → dashboard
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  const disabled = loading || forgotLoading || googleLoading

  // ── Connexion email ───────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      console.error('[login] signInWithPassword error:', authErr)
      setError(translateError(authErr.message))
      setLoading(false)
      return
    }
    // Vérifie qu'une session existe vraiment (email non confirmé → pas de session)
    const { data: { session } } = await supabase.auth.getSession()
    setLoading(false)
    if (!session) {
      setError('Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail.')
      return
    }
    if (rememberMe) {
      document.cookie = 'remember_session=true; path=/; max-age=2592000; SameSite=Lax'
    } else {
      document.cookie = 'remember_session=; path=/; max-age=0'
    }
    router.replace('/dashboard')
  }

  // ── Mot de passe oublié ───────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setError(null)
    setForgotLoading(true)
    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: RESET_REDIRECT,
    })
    setForgotLoading(false)
    if (resetErr) { setError(translateError(resetErr.message)); return }
    setMode('forgot-sent')
  }

  // ── Google OAuth ──────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: OAUTH_REDIRECT, queryParams: { access_type: 'offline', prompt: 'consent' } },
    })
    if (oauthErr) { setError('Connexion Google impossible.'); setGoogleLoading(false) }
  }

  // ── État : email de réinitialisation envoyé ───────────────────
  if (mode === 'forgot-sent') {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,222,128,0.15)' }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: '#4ADE80' }} />
        </div>
        <h2 className="text-[18px] font-bold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          Email envoyé
        </h2>
        <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
          Un lien de réinitialisation a été envoyé à <strong style={{ color: '#FFFFFF' }}>{forgotEmail}</strong>.
          Vérifiez votre boîte mail.
        </p>
        <button
          type="button"
          onClick={() => { setMode('login'); setForgotEmail(''); setError(null) }}
          className="text-[14px] font-medium transition-opacity hover:opacity-70"
          style={{ color: '#7798AB', fontFamily: 'var(--font-display)' }}
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  // ── État : formulaire mot de passe oublié ─────────────────────
  if (mode === 'forgot') {
    return (
      <>
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null) }}
          className="flex items-center gap-1.5 mb-5 text-[13px] transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft size={14} /> Retour
        </button>

        <h2 className="text-[19px] font-bold mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          Mot de passe oublié ?
        </h2>
        <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        {error && <ErrBox msg={error} />}

        <form onSubmit={handleForgot} className="space-y-3">
          <RPInput
            type="email"
            placeholder="Adresse email"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            autoComplete="email"
            disabled={disabled}
            required
          />
          <SubmitBtn loading={forgotLoading} disabled={disabled || !forgotEmail}>
            Recevoir le lien de réinitialisation
          </SubmitBtn>
        </form>
      </>
    )
  }

  // ── État principal : connexion ─────────────────────────────────
  return (
    <>
      <h2 className="text-[24px] font-bold text-center mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
        Connexion
      </h2>
      <p className="text-[13px] text-center mb-5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
        Accédez à votre espace PilotResto
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={disabled}
        className="w-full h-[44px] flex items-center justify-center gap-2.5 rounded-[8px] text-[15px] font-medium mb-4 transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ background: '#1A1A1A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }}
      >
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
        Continuer avec Google
      </button>

      {/* Séparateur */}
      <div className="relative flex items-center mb-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="px-3 text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {error && <ErrBox msg={error} />}

      <form onSubmit={handleLogin} className="space-y-3">
        <RPInput
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          disabled={disabled}
          required
        />

        <RPInput
          type={showPwd ? 'text' : 'password'}
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={disabled}
          style={{ paddingRight: '44px' }}
          icon={
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          required
        />

        {/* Se souvenir de moi + Mot de passe oublié */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[13px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ accentColor: '#7798AB', width: 15, height: 15, flexShrink: 0 }}
            />
            Se souvenir de moi
          </label>
          <button
            type="button"
            onClick={() => { setMode('forgot'); setForgotEmail(email); setError(null) }}
            className="text-[13px] transition-opacity hover:opacity-70"
            style={{ color: '#7798AB', fontFamily: 'var(--font-body)' }}
          >
            Mot de passe oublié ?
          </button>
        </div>

        <SubmitBtn loading={loading} disabled={disabled || !email || !password}>
          Se connecter
        </SubmitBtn>
      </form>

      <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold" style={{ color: '#7798AB', fontFamily: 'var(--font-display)' }}>
          S&apos;inscrire gratuitement
        </Link>
      </p>
    </>
  )
}

// ── Icône Google ──────────────────────────────────────────────

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
