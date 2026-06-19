import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default function LanguePage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Langue et région
        </h1>
      </div>

      <div className="rounded-2xl border flex flex-col items-center gap-4 py-16 text-center"
        style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--rp-lavender-light)' }}>
          <Clock className="w-7 h-7" style={{ color: 'var(--rp-navy-muted)' }} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--rp-navy)' }}>Bientôt disponible</p>
          <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--rp-navy-muted)' }}>
            La sélection de la langue et du fuseau horaire arrive prochainement.
          </p>
        </div>
        <Link href="/dashboard/parametres"
          className="mt-2 px-5 py-2 text-sm font-medium rounded-xl transition-colors"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}>
          Retour aux paramètres
        </Link>
      </div>
    </div>
  )
}
