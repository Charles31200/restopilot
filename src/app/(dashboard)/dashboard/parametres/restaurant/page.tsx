'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const inputCls = `
  w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none
  transition-colors duration-150
  focus:border-[var(--rp-amber)] focus:ring-2 focus:ring-[#D4952A20]
`
const labelCls = 'block text-xs font-semibold mb-1.5'

export default function RestaurantPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [restaurantId,     setRestaurantId]     = useState('')
  const [name,             setName]             = useState('')
  const [address,          setAddress]          = useState('')
  const [siret,            setSiret]            = useState('')
  const [accountantEmail,  setAccountantEmail]  = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.restaurant_id) return

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name, address, siret, accountant_email')
        .eq('id', profile.restaurant_id)
        .single()

      if (!restaurant) return

      setRestaurantId(restaurant.id)
      setName(restaurant.name ?? '')
      setAddress(restaurant.address ?? '')
      setSiret(restaurant.siret ?? '')
      setAccountantEmail(restaurant.accountant_email ?? '')
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom du restaurant est requis.'); return }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const emailVal = accountantEmail.trim()
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError("L'email de l'expert-comptable n'est pas valide.")
      setSaving(false)
      return
    }

    const { error: err } = await supabase
      .from('restaurants')
      .update({
        name:             name.trim(),
        address:          address.trim() || null,
        siret:            siret.trim()   || null,
        accountant_email: emailVal       || null,
      })
      .eq('id', restaurantId)

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
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Mon restaurant
        </h1>
      </div>

      <div className="rounded-2xl border" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--rp-navy-muted)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
                Nom du restaurant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Le Petit Bistrot"
                required
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)' }}
              />
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>Adresse complète</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="12 rue de la Paix, 75001 Paris"
                rows={2}
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)', resize: 'none' }}
              />
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
                Numéro SIRET <span className="font-normal" style={{ color: 'var(--rp-navy-muted)' }}>(optionnel)</span>
              </label>
              <input
                type="text"
                value={siret}
                onChange={e => setSiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder="12345678901234"
                maxLength={14}
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)', fontFamily: 'var(--font-mono)' }}
              />
              {siret && siret.length !== 14 && (
                <p className="text-xs mt-1" style={{ color: 'var(--rp-warning)' }}>
                  Le SIRET doit contenir 14 chiffres ({siret.length}/14)
                </p>
              )}
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
                Email de votre expert-comptable{' '}
                <span className="font-normal" style={{ color: 'var(--rp-navy-muted)' }}>(optionnel)</span>
              </label>
              <input
                type="email"
                value={accountantEmail}
                onChange={e => setAccountantEmail(e.target.value)}
                placeholder="comptable@cabinet-xyz.fr"
                className={inputCls}
                style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy)' }}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--rp-navy-muted)' }}>
                Utilisé pour l&apos;envoi automatique du fichier FEC depuis la page Comptabilité.
              </p>
            </div>

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-success-bg)', color: 'var(--rp-success)' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Restaurant mis à jour avec succès.
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
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
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
