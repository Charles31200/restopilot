'use client'

/**
 * BottomSheet — remplace TOUTES les modals de l'app sur mobile.
 *
 * Usage :
 *   <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Titre">
 *     ...contenu...
 *   </BottomSheet>
 *
 * Comportement natif :
 *  - S'ouvre par le bas avec animation slide-up (300ms ease-out)
 *  - Ferme au clic sur l'overlay ou swipe-down sur le handle
 *  - Handle bar en haut du sheet
 *  - Max-height 85vh avec scroll interne
 *  - Safe-area padding en bas (iPhone notch)
 *  - Sur desktop (lg+) : se comporte comme une modal centrée
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type BottomSheetProps = {
  isOpen:       boolean
  onClose:      () => void
  title?:       string
  description?: string
  /** Masque le bouton × en haut à droite */
  hideClose?:   boolean
  /** Classe CSS additionnelle sur le sheet (ex: pour ajuster la hauteur) */
  className?:   string
  children:     React.ReactNode
  /** Action sticky en bas du sheet (bouton primaire, etc.) */
  footer?:      React.ReactNode
}

// ── Composant ─────────────────────────────────────────────────

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  hideClose = false,
  className,
  children,
  footer,
}: BottomSheetProps) {
  const [mounted,  setMounted]  = useState(false)
  const [closing,  setClosing]  = useState(false)
  const sheetRef  = useRef<HTMLDivElement>(null)

  // Montage côté client uniquement (portal)
  useEffect(() => { setMounted(true) }, [])

  // Gestion du scroll body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Fermeture avec animation slide-down
  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 250)
  }, [onClose])

  // Echap keyboard
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, handleClose])

  // ── Swipe-down sur le handle ──────────────────────────────────
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) handleClose()   // swipe down de 80px+ → fermer
  }

  if (!mounted || (!isOpen && !closing)) return null

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center',
        'transition-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0',
          closing ? 'animate-fade-out' : 'animate-fade-in'
        )}
        style={{ background: 'rgba(53,64,79,.50)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          // Mobile : slide depuis le bas
          'relative w-full max-h-[85vh] flex flex-col',
          'bg-white',
          // Coins arrondis en haut sur mobile, tout autour sur desktop
          'rounded-t-[20px] lg:rounded-2xl',
          // Desktop : largeur max + ombre modale
          'lg:max-w-lg lg:mx-4',
          closing ? 'animate-slide-down lg:animate-fade-out' : 'animate-slide-up lg:animate-fade-in',
          className
        )}
        style={{ boxShadow: 'var(--rp-shadow-modal)' }}
      >
        {/* Handle (mobile only) */}
        <div
          className="lg:hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="rp-sheet-handle" />
        </div>

        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-base font-semibold text-rp-navy font-display leading-tight truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-rp-navy-muted mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={handleClose}
                className="touch-target w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl text-rp-navy-muted hover:text-rp-navy hover:bg-rp-lavender-light transition-colors flex-shrink-0 ml-3"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Séparateur si header présent */}
        {title && <div className="h-px bg-rp-lavender-light mx-5 flex-shrink-0" />}

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {/* Footer sticky */}
        {footer && (
          <>
            <div className="h-px bg-rp-lavender-light mx-5 flex-shrink-0" />
            <div
              className="px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] flex-shrink-0 bg-white"
            >
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
