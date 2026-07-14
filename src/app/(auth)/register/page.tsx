'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signUpAction, verifyOtpAction } from '@/lib/supabase/actions'

// ── Composants locaux ─────────────────────────────────────────

function RPInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-[8px] text-[15px] outline-none transition-colors duration-150"
      style={{
        background: '#111111',
        border:     '1px solid rgba(255,255,255,0.1)',
        padding:    '12px 16px',
        color:      '#FFFFFF',
        fontFamily: 'var(--font-body)',
      }}
      onFocus={e => (e.target.style.borderColor = '#7798AB')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
      {...props}
    />
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
      className="w-full h-[44px] rounded-[8px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
      style={{ background: '#7798AB', color: '#fff', fontFamily: 'var(--font-display)' }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step,            setStep]           = useState<'form' | 'otp'>('form')
  const [firstName,       setFirstName]      = useState('')
  const [lastName,        setLastName]       = useState('')
  const [email,           setEmail]          = useState('')
  const [password,        setPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd,         setShowPwd]        = useState(false)
  const [showConfirm,     setShowConfirm]    = useState(false)
  const [otpDigits,       setOtpDigits]      = useState(['', '', '', '', '', ''])
  const [otpError,        setOtpError]       = useState<string | null>(null)
  const [otpLoading,      setOtpLoading]     = useState(false)
  const [resendLoading,   setResendLoading]  = useState(false)
  const [resendSent,      setResendSent]     = useState(false)
  const [error,           setError]          = useState<string | null>(null)
  const [loading,         setLoading]        = useState(false)
  const [googleLoading,   setGoogleLoading]  = useState(false)

  const disabled = loading || googleLoading

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://restopilot.pro/api/auth/callback',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (oauthErr) { setError('Connexion Google impossible.'); setGoogleLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !email || !password || !confirmPassword) return
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError(null)
    setLoading(true)
    const result = await signUpAction(email, firstName, lastName, password)
    setLoading(false)
    if (result && 'error' in result) {
      setError(result.error)
    } else {
      setStep('otp')
    }
  }

  // ── Vérification OTP ──────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    // Accepte chiffre ou colle plusieurs chiffres d'un coup (ex: depuis gestionnaire de mots de passe)
    const digits = value.replace(/\D/g, '').slice(0, 6 - index)
    if (!digits) return
    const next = [...otpDigits]
    for (let i = 0; i < digits.length && index + i < 6; i++) {
      next[index + i] = digits[i]
    }
    setOtpDigits(next)
    setOtpError(null)
    // Focalise la prochaine case vide
    const nextEmpty = Math.min(index + digits.length, 5)
    const el = document.getElementById(`otp-${nextEmpty}`)
    if (el) (el as HTMLInputElement).focus()
    // Soumet automatiquement si le code est complet
    if (next.every(d => d !== '')) handleOtpSubmit(next.join(''))
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const next = [...otpDigits]; next[index] = ''; setOtpDigits(next)
      } else if (index > 0) {
        const prev = document.getElementById(`otp-${index - 1}`)
        if (prev) (prev as HTMLInputElement).focus()
      }
    }
  }

  const handleOtpSubmit = async (code: string) => {
    setOtpError(null)
    setOtpLoading(true)
    const result = await verifyOtpAction(email, code)
    setOtpLoading(false)
    if (result && 'error' in result) {
      setOtpError(result.error)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => document.getElementById('otp-0')?.focus(), 50)
    }
    // En cas de succès, verifyOtpAction appelle redirect('/onboarding')
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSent(false)
    setOtpError(null)
    const result = await signUpAction(email, firstName, lastName, password)
    setResendLoading(false)
    if (result && 'error' in result) {
      setOtpError(result.error)
    } else {
      setResendSent(true)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => document.getElementById('otp-0')?.focus(), 50)
    }
  }

  // ── Écran OTP ─────────────────────────────────────────────────
  if (step === 'otp') {
    const otpCode = otpDigits.join('')
    const otpComplete = otpCode.length === 6

    return (
      <div className="py-2">
        {/* Icône */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(74,222,128,0.15)' }}>
          <Mail className="w-6 h-6" style={{ color: '#4ADE80' }} />
        </div>

        <h2 className="text-[18px] font-bold text-center mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          Code de confirmation
        </h2>
        <p className="text-[13px] text-center mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
          Entrez le code à 6 chiffres envoyé à{' '}
          <strong style={{ color: '#FFFFFF' }}>{email}</strong>
        </p>

        {/* 6 cases OTP */}
        <div className="flex justify-center gap-2 mb-4">
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              onFocus={e => e.target.select()}
              disabled={otpLoading}
              className="text-center text-[22px] font-bold rounded-[8px] outline-none transition-all"
              style={{
                width:       '44px',
                height:      '56px',
                background:  '#111111',
                border:      digit ? '2px solid #7798AB' : '1px solid rgba(255,255,255,0.1)',
                color:       '#FFFFFF',
                fontFamily:  'var(--font-display)',
                caretColor:  '#7798AB',
              }}
              onFocusCapture={e => (e.target.style.borderColor = '#7798AB')}
              onBlurCapture={e => { if (!digit) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              autoFocus={i === 0}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
            />
          ))}
        </div>

        {/* Erreur OTP */}
        {otpError && (
          <div className="mb-3 p-3 rounded-[10px] text-[13px] text-center" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', fontFamily: 'var(--font-body)' }}>
            {otpError}
          </div>
        )}

        {/* Bouton valider (visible si code partiel ou erreur) */}
        {(!otpComplete || otpLoading) && (
          <button
            type="button"
            onClick={() => handleOtpSubmit(otpCode)}
            disabled={!otpComplete || otpLoading}
            className="w-full h-[44px] rounded-[8px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 mb-3"
            style={{ background: '#7798AB', color: '#fff', fontFamily: 'var(--font-display)' }}
          >
            {otpLoading ? <><Loader2 size={16} className="animate-spin" />Vérification…</> : 'Confirmer'}
          </button>
        )}

        {/* Renvoyer le code */}
        <div className="text-center mt-2">
          {resendSent ? (
            <p className="text-[13px] flex items-center justify-center gap-1.5" style={{ color: '#4ADE80', fontFamily: 'var(--font-body)' }}>
              <CheckCircle2 size={14} /> Nouveau code envoyé
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[13px] transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: '#7798AB', fontFamily: 'var(--font-body)' }}
            >
              {resendLoading ? 'Envoi en cours…' : 'Renvoyer le code'}
            </button>
          )}
        </div>

        {/* Retour */}
        <p className="text-center text-[12px] mt-4" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
          <button type="button" onClick={() => { setStep('form'); setOtpDigits(['', '', '', '', '', '']); setOtpError(null) }}
            className="underline transition-opacity hover:opacity-70">
            Modifier mes informations
          </button>
        </p>
      </div>
    )
  }

  // ── Formulaire d'inscription ──────────────────────────────────
  return (
    <>
      <h2 className="text-[24px] font-bold text-center mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
        Créer un compte
      </h2>
      <p className="text-[13px] text-center mb-5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
        14 jours gratuits · Sans engagement
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={disabled}
        className="w-full h-[44px] flex items-center justify-center gap-2.5 rounded-[8px] text-[15px] font-medium mb-4 transition-opacity disabled:opacity-50"
        style={{ background: '#1A1A1A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }}
      >
        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
        Continuer avec Google
      </button>

      {/* Séparateur */}
      <div className="relative flex items-center mb-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="px-3 text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-[10px] text-[13px]" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', fontFamily: 'var(--font-body)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <RPInput
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoComplete="given-name"
            disabled={disabled}
            required
          />
          <RPInput
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            autoComplete="family-name"
            disabled={disabled}
            required
          />
        </div>

        <RPInput
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          disabled={disabled}
          required
        />

        {/* Mot de passe */}
        <div className="relative">
          <RPInput
            type={showPwd ? 'text' : 'password'}
            placeholder="Mot de passe (min. 8 caractères)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={disabled}
            style={{ paddingRight: '44px' }}
            required
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirmation mot de passe */}
        <div className="relative">
          <RPInput
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={disabled}
            style={{ paddingRight: '44px' }}
            required
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <SubmitBtn loading={loading} disabled={disabled || !firstName || !lastName || !email || !password || !confirmPassword}>
          Créer mon compte
        </SubmitBtn>
      </form>

      <p className="text-[11px] text-center mt-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
        En créant un compte vous acceptez nos{' '}
        <a href="/cgu-cgv" className="underline">CGU</a>{' '}et notre{' '}
        <a href="/politique-de-confidentialite" className="underline">politique de confidentialité</a>.
      </p>

      <p className="text-center text-[13px] mt-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#7798AB', fontFamily: 'var(--font-display)' }}>
          Se connecter
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
