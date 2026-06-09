'use client'

/**
 * SaleModal — saisie manuelle d'une journée de ventes.
 * Champs : date (défaut = aujourd'hui), CA total, nombre de couverts.
 * Soumet en POST /api/sales puis appelle onSaved() pour déclencher un refresh.
 */

import { useForm }           from 'react-hook-form'
import { zodResolver }       from '@hookform/resolvers/zod'
import { z }                 from 'zod'
import { Loader2, AlertCircle, CalendarDays, Euro, Users } from 'lucide-react'
import { useState }          from 'react'
import { Modal }             from '@/components/ui/Modal'
import { cn }                from '@/lib/utils/cn'

// ── Schéma ────────────────────────────────────────────────────

// z.number() + valueAsNumber: true dans register() — même pattern que ProductModal
const schema = z.object({
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  total_revenue: z.number().min(0, 'CA ≥ 0'),
  covers:        z.number().int().min(0, 'Couverts ≥ 0'),
})

type FormData = z.infer<typeof schema>

// ── Helpers UI ────────────────────────────────────────────────

function todayISO() {
  return new Date().toLocaleDateString('sv-SE') // 'sv-SE' → YYYY-MM-DD
}

const labelCls = 'block text-[12px] font-semibold uppercase tracking-wide mb-1.5'
const inputCls = (hasError?: boolean) =>
  cn(
    'w-full h-[52px] rounded-[14px] border px-4 text-[15px] outline-none transition-all',
    'focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-100'
      : 'border-[var(--rp-lavender)] bg-white text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20',
  )

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────

type SaleModalProps = {
  onClose:  () => void
  onSaved:  () => void   // callback → déclenche router.refresh() dans le parent
}

// ── Composant ─────────────────────────────────────────────────

export function SaleModal({ onClose, onSaved }: SaleModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date:          todayISO(),
      total_revenue: undefined,
      covers:        0,
    },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch('/api/sales', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? `Erreur ${res.status}`)
        return
      }

      onSaved()   // déclenche router.refresh() dans DashboardActions
      onClose()
    } catch {
      setServerError('Erreur réseau. Veuillez réessayer.')
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 h-[48px] rounded-full border text-[14px] font-medium transition hover:bg-gray-50"
        style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy-muted)' }}
      >
        Annuler
      </button>
      <button
        type="submit"
        form="sale-form"
        disabled={isSubmitting}
        className={cn(
          'flex-1 h-[48px] rounded-full text-[14px] font-semibold text-white',
          'flex items-center justify-center gap-2 transition active:scale-[0.98]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
        )}
        style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )

  return (
    <Modal
      title="Saisir une vente"
      onClose={onClose}
      maxWidth="max-w-md"
      footer={footer}
    >
      {serverError && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2"
          style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form id="sale-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Date */}
        <div>
          <label
            htmlFor="sale-date"
            className={labelCls}
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Date
            </span>
          </label>
          <input
            id="sale-date"
            type="date"
            className={inputCls(!!errors.date)}
            {...register('date')}
          />
          <FieldError msg={errors.date?.message} />
        </div>

        {/* CA total */}
        <div>
          <label
            htmlFor="sale-revenue"
            className={labelCls}
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" />
              Chiffre d&apos;affaires
            </span>
          </label>
          <div className="relative">
            <input
              id="sale-revenue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn(inputCls(!!errors.total_revenue), 'pr-10')}
              {...register('total_revenue', { valueAsNumber: true })}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium select-none"
              style={{ color: 'var(--rp-navy-muted)' }}
            >
              €
            </span>
          </div>
          <FieldError msg={errors.total_revenue?.message} />
        </div>

        {/* Couverts */}
        <div>
          <label
            htmlFor="sale-covers"
            className={labelCls}
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Couverts
            </span>
          </label>
          <input
            id="sale-covers"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            className={inputCls(!!errors.covers)}
            {...register('covers', { valueAsNumber: true })}
          />
          <FieldError msg={errors.covers?.message} />
        </div>

      </form>
    </Modal>
  )
}
