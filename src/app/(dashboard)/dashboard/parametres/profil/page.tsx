'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

// ── Shared styles ─────────────────────────────────────────────

const inputCls = `
  w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none
  transition-colors duration-150
  focus:border-[var(--rp-amber)] focus:ring-2 focus:ring-[#D4952A20]
`
const labelCls = 'block text-xs font-semibold mb-1.5'

// ── Page ──────────────────────────────────────────────────────

export default function ProfilPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [email,     setEmail]     = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [userId,    setUserId]    = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      setFirstName(profile?.first_name ?? '')
      setLastName(profile?.last_name  ?? '')
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: err } = await supabase
      .from('profiles')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq('id', userId)

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Informations personnelles
        </h1>
      </div>

      {/* Carte formulaire */}
      <div className="rounded-2xl border" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--rp-navy-muted)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Prénom */}
            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Votre prénom"
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)' }}
              />
            </div>

            {/* Nom */}
            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Votre nom"
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)' }}
              />
            </div>

            {/* Email (non modifiable) */}
            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
                Email <span className="font-normal" style={{ color: 'var(--rp-navy-muted)' }}>(non modifiable)</span>
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)', background: 'var(--rp-lavender-light)', cursor: 'not-allowed' }}
              />
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-success-bg)', color: 'var(--rp-success)' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Profil mis à jour avec succès.
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: saving ? 'var(--rp-amber-dark)' : 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
