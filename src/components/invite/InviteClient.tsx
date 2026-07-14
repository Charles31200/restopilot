'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, AlertCircle, XCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

type VerifyResponse = {
  valid:           boolean
  email?:          string
  employeeFirst?:  string
  restaurantName?: string
  error?:          string
}

type LoadState = 'loading' | 'invalid' | 'form'

// ── Composants locaux (mêmes patterns que login/register) ──────

function InviteInput({
  icon,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-[8px] text-[15px] outline-none transition-colors duration-150 placeholder:text-[rgba(255,255,255,0.3)]"
        style={{
          background: '#111111',
          border:     '1px solid rgba(255,255,255,0.1)',
          padding:    icon ? '12px 44px 12px 16px' : '12px 16px',
          color:      '#FFFFFF',
          fontFamily: 'var(--font-body)',
          ...style,
        }}
        onFocus={e => (e.target.style.borderColor = '#7798AB')}
        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
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

// ── Composant page ───────────────────────────────────────────

export function InviteClient({ token }: { token: string }) {
  const [loadState,   setLoadState]   = useState<LoadState>('loading')
  const [invalidMsg,  setInvalidMsg]  = useState('Cette invitation est introuvable.')
  const [data,         setData]        = useState<VerifyResponse | null>(null)

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd,          setShowPwd]         = useState(false)
  const [showConfirm,      setShowConfirm]     = useState(false)
  const [formError,        setFormError]       = useState<string | null>(null)
  const [submitting,       setSubmitting]      = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/invitations/${token}`)
      .then(res => res.json())
      .then((json: VerifyResponse) => {
        if (cancelled) return
        if (json.valid) {
          setData(json)
          setLoadState('form')
        } else {
          setInvalidMsg(json.error ?? 'Cette invitation est introuvable.')
          setLoadState('invalid')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvalidMsg('Impossible de vérifier cette invitation. Réessayez.')
          setLoadState('invalid')
        }
      })
    return () => { cancelled = true }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    try {
      const res  = await fetch(`/api/invitations/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password, confirmPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? 'Une erreur est survenue. Réessayez.')
        setSubmitting(false)
        return
      }
      // Rechargement complet pour que le middleware reparte avec la
      // session fraîchement posée par la route (cookies via Set-Cookie).
      window.location.href = '/employee/dashboard'
    } catch {
      setFormError('Erreur réseau. Réessayez.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#0F0F0F' }}
    >
      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="pb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '40px', width: 'auto', marginBottom: '10px' }} />
          <span className="font-extrabold text-[20px]" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            PilotResto
          </span>
        </div>

        <div
          className="rounded-[24px] p-6 sm:p-8"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {loadState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7798AB' }} />
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
                Vérification de l&apos;invitation…
              </p>
            </div>
          )}

          {loadState === 'invalid' && (
            <div className="text-center py-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(248,113,113,0.15)' }}
              >
                <XCircle className="w-6 h-6" style={{ color: '#F87171' }} />
              </div>
              <h2 className="text-[18px] font-bold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                Invitation invalide
              </h2>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
                {invalidMsg}
              </p>
              <Link
                href="/login"
                className="text-[14px] font-medium transition-opacity hover:opacity-70"
                style={{ color: '#7798AB', fontFamily: 'var(--font-display)' }}
              >
                ← Retour à la connexion
              </Link>
            </div>
          )}

          {loadState === 'form' && data && (
            <>
              <h2 className="text-[22px] font-bold text-center mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                Bonjour {data.employeeFirst} 👋
              </h2>
              <p className="text-[13px] text-center mb-5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
                <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{data.restaurantName}</strong> vous invite sur PilotResto.
                Choisissez un mot de passe pour créer votre compte.
              </p>

              {formError && (
                <div
                  className="mb-3 p-3 rounded-[10px] text-[13px] flex items-start gap-2"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', fontFamily: 'var(--font-body)' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <InviteInput
                  type="email"
                  value={data.email}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />

                <InviteInput
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mot de passe (min. 8 caractères)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                  style={{ paddingRight: '44px' }}
                  icon={
                    <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}>
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  required
                />

                <InviteInput
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                  style={{ paddingRight: '44px' }}
                  icon={
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  required
                />

                <SubmitBtn loading={submitting} disabled={submitting || !password || !confirmPassword}>
                  Créer mon compte
                </SubmitBtn>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
        © 2026 PilotResto
      </p>
    </div>
  )
}
