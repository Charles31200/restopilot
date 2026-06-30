'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient }        from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()

  const [ready,           setReady]           = useState(false)
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd,         setShowPwd]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Vérifie si une session est déjà présente (arrivée depuis /api/auth/callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // Écoute les événements SIGNED_IN / PASSWORD_RECOVERY (flux PKCE ou recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    setDone(true)

    // Déterminer la destination : onboarding si first_name absent, sinon dashboard
    const { data: { user } } = await supabase.auth.getUser()
    let destination = '/onboarding'

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single()

      if (profile?.first_name) destination = '/dashboard'
    }

    setTimeout(() => router.replace(destination), 1500)
  }

  // ── Layout (propre — hors du groupe auth) ─────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#FFFFFF' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="pb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '40px', width: 'auto', marginBottom: '10px' }} />
          <span className="font-extrabold text-[20px]" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
            PilotResto
          </span>
        </div>

        {/* Succès */}
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#C3DBC5' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: '#166534' }} />
            </div>
            <p className="font-bold text-[17px] mb-1" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
              Mot de passe créé !
            </p>
            <p className="text-[13px]" style={{ color: '#888888', fontFamily: 'var(--font-body)' }}>
              Redirection en cours…
            </p>
          </div>

        ) : !ready ? (
          /* Attente de la session */
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#111111' }} />
            <p className="text-[14px]" style={{ color: '#888888', fontFamily: 'var(--font-body)' }}>
              Vérification en cours…
            </p>
          </div>

        ) : (
          /* Formulaire */
          <>
            <h1 className="text-[24px] font-bold text-center mb-1" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
              Créez votre mot de passe
            </h1>
            <p className="text-[13px] text-center mb-5" style={{ color: '#888888', fontFamily: 'var(--font-body)' }}>
              ✉️ Votre email est confirmé
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-[8px] text-[13px]" style={{ background: '#FEF2F2', color: '#DC2626', fontFamily: 'var(--font-body)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Mot de passe */}
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mot de passe (min. 8 caractères)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  className="w-full rounded-[8px] text-[15px] outline-none transition-colors duration-150"
                  style={{
                    background:  '#FFFFFF',
                    border:      '1px solid #E5E5E5',
                    padding:     '12px 44px 12px 16px',
                    color:       '#111111',
                    fontFamily:  'var(--font-body)',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#111111')}
                  onBlur={e  => (e.target.style.borderColor = '#E5E5E5')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirmation */}
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                  className="w-full rounded-[8px] text-[15px] outline-none transition-colors duration-150"
                  style={{
                    background:  '#FFFFFF',
                    border:      '1px solid #E5E5E5',
                    padding:     '12px 44px 12px 16px',
                    color:       '#111111',
                    fontFamily:  'var(--font-body)',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#111111')}
                  onBlur={e  => (e.target.style.borderColor = '#E5E5E5')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full h-[44px] rounded-[8px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
                style={{ background: '#000000', color: '#fff', fontFamily: 'var(--font-display)' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Création…</> : 'Créer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-8 text-[11px]" style={{ color: '#BBBBBB', fontFamily: 'var(--font-body)' }}>
        © 2026 PilotResto · Essai gratuit 14 jours
      </p>
    </div>
  )
}
