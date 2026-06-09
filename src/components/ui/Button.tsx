'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

export type ButtonVariant = 'amber' | 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  fullWidth?: boolean
  icon?:     React.ReactNode
  iconRight?: React.ReactNode
}

// ── Classes par variant ────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  amber: [
    'text-white font-semibold',
    'rounded-full',        // CTA principaux → toujours pill
    'active:scale-[0.97] transition-all duration-100',
  ].join(' '),

  primary: [
    'text-white font-semibold',
    'rounded-full',
    'active:scale-[0.97] transition-all duration-100',
  ].join(' '),

  secondary: [
    'bg-white font-medium',
    'rounded-xl',
    'border transition-colors duration-150',
  ].join(' '),

  ghost: [
    'bg-transparent font-medium',
    'rounded-xl',
    'transition-colors duration-150',
  ].join(' '),

  danger: [
    'font-medium',
    'rounded-xl',
    'border transition-colors duration-150',
  ].join(' '),
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-12 px-5 text-[15px] gap-2',
  lg: 'h-14 px-6 text-base  gap-2',
}

// ── Inline styles par variant (paletter) ──────────────────────

function variantInlineStyle(variant: ButtonVariant, disabled: boolean): React.CSSProperties {
  const opacity = disabled ? 0.5 : 1
  switch (variant) {
    case 'amber':
      return {
        background: 'var(--rp-amber)',
        boxShadow:  '0 2px 8px rgba(212,149,42,.30)',
        opacity,
        fontFamily: 'var(--font-display)',
      }
    case 'primary':
      return {
        background: 'var(--rp-navy)',
        boxShadow:  '0 2px 8px rgba(53,64,79,.25)',
        opacity,
        fontFamily: 'var(--font-display)',
      }
    case 'secondary':
      return {
        color:       'var(--rp-navy)',
        borderColor: 'var(--rp-lavender)',
        opacity,
        fontFamily:  'var(--font-body)',
      }
    case 'ghost':
      return {
        color:      'var(--rp-navy-muted)',
        opacity,
        fontFamily: 'var(--font-body)',
      }
    case 'danger':
      return {
        background:  'var(--rp-danger-bg)',
        color:       'var(--rp-danger)',
        borderColor: 'var(--rp-danger)',
        opacity,
        fontFamily:  'var(--font-body)',
      }
  }
}

// ── Hover class overrides ─────────────────────────────────────

const HOVER_OVERRIDES: Record<ButtonVariant, string> = {
  amber:     'hover:brightness-90',
  primary:   'hover:brightness-125',
  secondary: 'hover:bg-rp-lavender-light',
  ghost:     'hover:bg-rp-lavender-light hover:text-rp-navy',
  danger:    'hover:brightness-95',
}

// ── Composant ─────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant   = 'amber',
    size      = 'md',
    loading   = false,
    fullWidth = false,
    icon,
    iconRight,
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center select-none',
        'min-w-[48px]',          // touch target minimum
        '-webkit-tap-highlight-color: transparent',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        HOVER_OVERRIDES[variant],
        fullWidth && 'w-full',
        isDisabled && 'cursor-not-allowed pointer-events-none',
        className
      )}
      style={variantInlineStyle(variant, !!isDisabled)}
      {...rest}
    >
      {loading
        ? <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin flex-shrink-0" />
        : icon && <span className="flex-shrink-0">{icon}</span>
      }
      {children && <span className="truncate">{children}</span>}
      {iconRight && !loading && <span className="flex-shrink-0 ml-auto">{iconRight}</span>}
    </button>
  )
})
