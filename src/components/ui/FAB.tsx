'use client'

import { Plus } from 'lucide-react'
import { cn }   from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type FABProps = {
  onClick:    () => void
  icon?:      React.ReactNode
  label?:     string        // Pour l'accessibilité (aria-label)
  /** Position custom en bas (défaut : 88px = au-dessus de la BottomNav) */
  bottom?:    number
  className?: string
}

// ── Composant ─────────────────────────────────────────────────

export function FAB({ onClick, icon, label = 'Ajouter', bottom = 88, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed right-4 z-40 w-14 h-14 rounded-full',
        'flex items-center justify-center',
        // Animation tap : scale 0.95 → spring-back 1.05 → 1
        'active:scale-95',
        'transition-transform duration-150',
        'lg:hidden',   // Visible uniquement sur mobile (desktop : FAB inutile)
        className
      )}
      style={{
        bottom:     `calc(${bottom}px + env(safe-area-inset-bottom, 0px))`,
        background: 'var(--rp-amber)',
        boxShadow:  '0 4px 16px rgba(212,149,42,.45)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon ?? <Plus size={26} strokeWidth={2.5} color="white" />}
    </button>
  )
}
