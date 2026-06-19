'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const inputCls = `
  w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm border outline-none
  transition-colors duration-150
  focus:border-[var(--rp-amber)] focus:ring-2 focus:ring-[#D4952A20]
`
const labelCls = 'block text-xs font-semibold mb-1.5'

function PasswordInput({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)' }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: 'var(--rp-navy-muted)' }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function SecuritePage() {
  const supabase = useMemo(() => createClient(), [])

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Sécurité et mot de passe
        </h1>
      </div>

      <div className="rounded-2xl border" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)' }}>
            <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Le nouveau mot de passe doit contenir au moins 8 caractères.
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>Nouveau mot de passe</label>
            <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" />
          </div>

          <div>
            <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>Confirmer le mot de passe</label>
            <PasswordInput value={confirm} onChange={setConfirm} placeholder="••••••••" />
          </div>

          {/* Indicateur de force */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[8, 12, 16].map(threshold => (
                  <div
                    key={threshold}
                    className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background: password.length >= threshold
                        ? threshold === 8 ? '#EF4444' : threshold === 12 ? '#F59E0B' : '#22C55E'
                        : 'var(--rp-lavender-light)',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
                {password.length < 8 ? 'Trop court' : password.length < 12 ? 'Acceptable' : password.length < 16 ? 'Bon' : 'Excellent'}
              </p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-success-bg)', color: 'var(--rp-success)' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Mot de passe mis à jour avec succès.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {saving ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
