'use client'

import { useRef, useState } from 'react'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type ListItemProps = {
  /** Icône ou avatar (40×40px) */
  leading?:    React.ReactNode
  title:       string
  subtitle?:   string
  /** Valeur affichée à droite (ex: prix, quantité) */
  trailing?:   React.ReactNode
  /** Affiche un chevron › à droite */
  chevron?:    boolean
  onClick?:    () => void
  onEdit?:     () => void
  onDelete?:   () => void
  className?:  string
  /** Ne pas afficher le séparateur du bas */
  noSeparator?: boolean
}

// ── Composant ─────────────────────────────────────────────────

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  chevron    = false,
  onClick,
  onEdit,
  onDelete,
  className,
  noSeparator = false,
}: ListItemProps) {
  const [swiped,     setSwiped]     = useState(false)
  const [tapActive,  setTapActive]  = useState(false)
  const touchStartX  = useRef(0)
  const touchStartY  = useRef(0)
  const SWIPE_THRESHOLD = 60

  // ── Gestion swipe gauche ──────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)

    // Swipe horizontal seulement (pas de scroll vertical)
    if (dy > 20) return

    if (dx < -SWIPE_THRESHOLD && (onEdit || onDelete)) {
      setSwiped(true)
    } else if (dx > SWIPE_THRESHOLD) {
      setSwiped(false)
    }
  }

  const hasSwipeActions = !!(onEdit || onDelete)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Actions swipe (révélées sur gauche) */}
      {hasSwipeActions && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center transition-transform duration-200',
            swiped ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {onEdit && (
            <button
              onClick={() => { setSwiped(false); onEdit() }}
              className="h-full px-5 flex items-center justify-center font-medium text-sm"
              style={{ background: 'var(--rp-blue-light)', color: 'var(--rp-blue-dark)', minWidth: 72 }}
              aria-label="Modifier"
            >
              <Pencil size={16} strokeWidth={2} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { setSwiped(false); onDelete() }}
              className="h-full px-5 flex items-center justify-center font-medium text-sm"
              style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)', minWidth: 72 }}
              aria-label="Supprimer"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Contenu principal */}
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => setTapActive(false)}
        onMouseDown={() => onClick && setTapActive(true)}
        onMouseUp={() => setTapActive(false)}
        onMouseLeave={() => setTapActive(false)}
        onClick={() => { if (swiped) { setSwiped(false); return } onClick?.() }}
        className={cn(
          'flex items-center min-h-[64px] transition-all duration-100',
          onClick && 'cursor-pointer',
          tapActive && 'bg-rp-lavender-light',
          hasSwipeActions && swiped && '-translate-x-36',
          'will-change-transform'
        )}
        style={{ background: tapActive ? 'var(--rp-lavender-light)' : 'transparent', transition: 'background 100ms, transform 200ms ease' }}
      >
        {/* Leading (icône / avatar 40px) */}
        {leading && (
          <div className="w-10 h-10 flex-shrink-0 mr-3 flex items-center justify-center">
            {leading}
          </div>
        )}

        {/* Contenu texte */}
        <div className="flex-1 min-w-0 py-3">
          <p
            className="text-[15px] font-medium leading-snug truncate"
            style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-body)' }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className="text-[13px] mt-0.5 truncate"
              style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Trailing + chevron */}
        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
          {trailing}
          {chevron && <ChevronRight size={16} style={{ color: 'var(--rp-lavender)' }} />}
        </div>
      </div>

      {/* Séparateur indenté */}
      {!noSeparator && (
        <div
          className="absolute bottom-0 right-0"
          style={{
            left:       leading ? '56px' : '16px',
            height:     '1px',
            background: 'var(--rp-lavender-light)',
          }}
        />
      )}
    </div>
  )
}
