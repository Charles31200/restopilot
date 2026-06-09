'use client'

/**
 * MobileHeader — Header natif mobile (< lg).
 *
 * Deux variantes :
 *  - 'dark'  : fond navy (#35404F) — utilisé sur la page d'accueil dashboard
 *  - 'light' : fond blanc          — utilisé sur les sous-pages
 *
 * Structure :
 *   [ChevronLeft 44×44] | [Titre centré] | [Action droite 44×44]
 *
 * Height : 56px + env(safe-area-inset-top) pour le notch iPhone.
 */

import { useRouter } from 'next/navigation'
import { ChevronLeft, Bell, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type MobileHeaderProps = {
  title:        string
  /** 'dark' = fond navy (home), 'light' = fond blanc (sous-pages) */
  variant?:     'dark' | 'light'
  /** Affiche le bouton retour */
  showBack?:    boolean
  /** Callback retour — défaut : router.back() */
  onBack?:      () => void
  /** Action contextuelle à droite (notification, filtre, etc.) */
  rightAction?: React.ReactNode
  /** Nombre de notifications non lues */
  badgeCount?:  number
}

// ── Composant ─────────────────────────────────────────────────

export function MobileHeader({
  title,
  variant     = 'light',
  showBack    = false,
  onBack,
  rightAction,
  badgeCount  = 0,
}: MobileHeaderProps) {
  const router = useRouter()
  const isDark = variant === 'dark'

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <header
      className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-40 flex flex-col',
        isDark ? 'bg-rp-navy' : 'bg-white border-b border-rp-lavender-light'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center h-14 px-2">
        {/* Bouton retour (44×44 touch target) */}
        <div className="w-11 flex-shrink-0">
          {showBack && (
            <button
              onClick={handleBack}
              className={cn(
                'w-11 h-11 flex items-center justify-center rounded-xl transition-colors',
                isDark
                  ? 'text-white/70 hover:bg-white/10 active:bg-white/20'
                  : 'text-rp-navy-light hover:bg-rp-lavender-light active:bg-rp-lavender'
              )}
              aria-label="Retour"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Titre centré */}
        <div className="flex-1 flex justify-center">
          <h1
            className={cn(
              'text-[17px] font-semibold leading-tight truncate max-w-[200px] text-center',
              isDark ? 'text-white' : 'text-rp-navy'
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        {/* Action droite (44×44 touch target) */}
        <div className="w-11 flex-shrink-0 flex justify-end">
          {rightAction ?? (
            /* Cloche par défaut avec badge si notifications */
            <button
              className={cn(
                'w-11 h-11 flex items-center justify-center rounded-xl relative transition-colors',
                isDark
                  ? 'text-white/70 hover:bg-white/10'
                  : 'text-rp-navy-muted hover:bg-rp-lavender-light'
              )}
              aria-label={badgeCount > 0 ? `${badgeCount} notification${badgeCount > 1 ? 's' : ''}` : 'Notifications'}
            >
              {badgeCount > 0
                ? <BellRing size={20} strokeWidth={2} />
                : <Bell    size={20} strokeWidth={1.75} />
              }
              {badgeCount > 0 && (
                <span
                  className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white leading-none"
                  style={{ background: 'var(--rp-amber)' }}
                  aria-hidden="true"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Spacer à placer juste après le header dans la page ────────

/**
 * À placer en haut de chaque page mobile pour compenser la hauteur du header fixe.
 * Usage : <MobileHeaderSpacer />
 */
export function MobileHeaderSpacer() {
  return (
    <div
      className="lg:hidden flex-shrink-0"
      style={{
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
      }}
      aria-hidden="true"
    />
  )
}
