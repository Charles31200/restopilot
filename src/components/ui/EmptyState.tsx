import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

// ── Types ─────────────────────────────────────────────────────

export type EmptyStateProps = {
  icon:       React.ReactNode
  title:      string
  subtitle?:  string
  ctaLabel?:  string
  onCta?:     () => void
  className?: string
}

// ── Composant ─────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 gap-3 px-6', className)}>
      {/* Icône 48px — couleur lavender */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--rp-lavender-light)' }}
      >
        <span style={{ color: 'var(--rp-lavender)' }}>{icon}</span>
      </div>

      {/* Titre */}
      <p
        className="text-[16px] font-semibold leading-snug"
        style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </p>

      {/* Sous-titre */}
      {subtitle && (
        <p
          className="text-[14px] leading-relaxed max-w-[260px]"
          style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
        >
          {subtitle}
        </p>
      )}

      {/* CTA optionnel */}
      {ctaLabel && onCta && (
        <Button variant="amber" size="md" onClick={onCta} className="mt-2">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
