import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type SectionHeaderProps = {
  title:       string
  /** Bouton "Voir tout" — href OU callback */
  onSeeAll?:   string | (() => void)
  seeAllLabel?: string
  className?:  string
}

// ── Composant ─────────────────────────────────────────────────

export function SectionHeader({ title, onSeeAll, seeAllLabel = 'Voir tout', className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mt-6 mb-2', className)}>
      <span
        className="text-[13px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
      >
        {title}
      </span>

      {onSeeAll && (
        typeof onSeeAll === 'string'
          ? <a
              href={onSeeAll}
              className="text-[13px] font-semibold"
              style={{ color: 'var(--rp-amber)', fontFamily: 'var(--font-body)' }}
            >
              {seeAllLabel}
            </a>
          : <button
              onClick={onSeeAll}
              className="text-[13px] font-semibold"
              style={{ color: 'var(--rp-amber)', fontFamily: 'var(--font-body)' }}
            >
              {seeAllLabel}
            </button>
      )}
    </div>
  )
}
