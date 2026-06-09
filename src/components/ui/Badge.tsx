import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type BadgeVariant = 'amber' | 'blue' | 'success' | 'warning' | 'danger' | 'navy' | 'khaki' | 'lavender'
export type BadgeSize    = 'sm' | 'md'

export type BadgeProps = {
  variant?:  BadgeVariant
  size?:     BadgeSize
  children:  React.ReactNode
  className?: string
}

// ── Config couleurs ───────────────────────────────────────────
// Règle : JAMAIS de bg plein (trop agressif) — toujours bg-light + texte-dark

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  amber:   { background: 'var(--rp-amber-light)',    color: 'var(--rp-amber-dark)'  },
  blue:    { background: 'var(--rp-blue-light)',     color: 'var(--rp-blue-dark)'   },
  success: { background: 'var(--rp-success-bg)',     color: 'var(--rp-success)'     },
  warning: { background: 'var(--rp-warning-bg)',     color: 'var(--rp-warning)'     },
  danger:  { background: 'var(--rp-danger-bg)',      color: 'var(--rp-danger)'      },
  navy:    { background: 'rgba(53,64,79,.10)',       color: 'var(--rp-navy)'        },
  khaki:   { background: 'var(--rp-khaki-light)',    color: 'var(--rp-khaki)'       },
  lavender:{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)'  },
}

// ── Composant ─────────────────────────────────────────────────

export function Badge({ variant = 'lavender', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap',
        size === 'sm' ? 'h-5 px-1.5 text-[10px]'
                      : 'h-6 px-2   text-[12px]',
        className
      )}
      style={{
        ...VARIANT_STYLES[variant],
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </span>
  )
}
