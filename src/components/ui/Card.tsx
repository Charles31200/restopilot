import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type CardVariant = 'default' | 'metric'

export type CardProps = {
  variant?:  CardVariant
  title?:    string
  subtitle?: string
  /** Nœud React affiché en haut à droite (ex: badge, bouton icône) */
  action?:   React.ReactNode
  className?: string
  children?: React.ReactNode
  /** padding custom — défaut 16px */
  padding?:  string
  onClick?:  () => void
}

// ── Composant ─────────────────────────────────────────────────

export function Card({
  variant   = 'default',
  title,
  subtitle,
  action,
  className,
  children,
  padding   = 'p-4',
  onClick,
}: CardProps) {
  const isMetric = variant === 'metric'

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={cn(
        'rounded-[16px] overflow-hidden',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform duration-100',
        padding,
        className
      )}
      style={{
        background:  isMetric ? 'var(--rp-amber-light)' : 'var(--rp-white)',
        border:      `1px solid ${isMetric ? 'var(--rp-amber)' : 'var(--rp-lavender-light)'}`,
        boxShadow:   'var(--rp-shadow-card)',
      }}
    >
      {/* Header row */}
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            {title && (
              <h3
                className="text-[15px] font-semibold leading-tight truncate"
                style={{
                  color:      isMetric ? 'var(--rp-amber-dark)' : 'var(--rp-navy)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </div>
  )
}
