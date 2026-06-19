'use client'

import { ArrowLeft, Globe, Clock, Info } from 'lucide-react'
import Link from 'next/link'

const labelCls = 'block text-xs font-semibold mb-1.5'

export default function LanguePage() {
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
          Langue et région
        </h1>
      </div>

      <div className="rounded-2xl border" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        <div className="p-6 space-y-5">
          {/* Langue */}
          <div>
            <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Langue de l&apos;interface
              </span>
            </label>
            <div
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--rp-lavender-light)', background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                Français
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--rp-amber-light)', color: 'var(--rp-amber-dark)' }}
              >
                Par défaut
              </span>
            </div>
          </div>

          {/* Fuseau horaire */}
          <div>
            <label className={labelCls} style={{ color: 'var(--rp-navy)' }}>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Fuseau horaire
              </span>
            </label>
            <div
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: 'var(--rp-lavender-light)', background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
            >
              <span>Europe/Paris</span>
              <span className="text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
                UTC+2 (CEST)
              </span>
            </div>
          </div>

          {/* Info */}
          <div
            className="flex items-start gap-2.5 p-4 rounded-xl text-sm"
            style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)' }}
          >
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--rp-amber)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--rp-navy)' }}>D&apos;autres langues arrivent bientôt</p>
              <p className="mt-0.5 text-xs leading-relaxed">
                RestoPilot est actuellement disponible uniquement en français.
                L&apos;anglais et l&apos;espagnol seront ajoutés prochainement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
