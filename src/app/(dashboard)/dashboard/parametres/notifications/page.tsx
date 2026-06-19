'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Prefs = {
  rapportHebdo:  boolean
  alertesStock:  boolean
  rappelCloture: boolean
}

const DEFAULTS: Prefs = {
  rapportHebdo:  true,
  alertesStock:  true,
  rappelCloture: false,
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
      style={{ background: enabled ? 'var(--rp-amber)' : 'var(--rp-lavender)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [prefs,   setPrefs]   = useState<Prefs>(DEFAULTS)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const saved = user.user_metadata?.notifications as Prefs | undefined
      if (saved) setPrefs({ ...DEFAULTS, ...saved })
      setLoading(false)
    }
    load()
  }, [supabase])

  const setPref = (key: keyof Prefs, value: boolean) =>
    setPrefs(p => ({ ...p, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: err } = await supabase.auth.updateUser({
      data: { notifications: prefs },
    })

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  const rows: { key: keyof Prefs; label: string; subtitle: string }[] = [
    {
      key:      'rapportHebdo',
      label:    'Rapport hebdomadaire',
      subtitle: 'Résumé de votre activité chaque lundi par email',
    },
    {
      key:      'alertesStock',
      label:    'Alertes stock critique',
      subtitle: 'Notification quand un article passe sous le seuil minimum',
    },
    {
      key:      'rappelCloture',
      label:    'Rappel de clôture journalière',
      subtitle: "Rappel le soir si la caisse n'a pas été clôturée",
    },
  ]

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
          Notifications
        </h1>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--rp-navy-muted)' }} />
          </div>
        ) : (
          <>
            {rows.map((row, i) => (
              <div key={row.key}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--rp-navy)' }}>{row.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>{row.subtitle}</p>
                  </div>
                  <Toggle enabled={prefs[row.key]} onChange={v => setPref(row.key, v)} />
                </div>
                {i < rows.length - 1 && (
                  <div className="h-px ml-5" style={{ background: 'var(--rp-lavender-light)' }} />
                )}
              </div>
            ))}

            <div className="px-5 py-4 space-y-3 border-t" style={{ borderColor: 'var(--rp-lavender-light)' }}>
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-success-bg)', color: 'var(--rp-success)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Préférences enregistrées.
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {saving ? 'Sauvegarde…' : 'Sauvegarder les préférences'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
