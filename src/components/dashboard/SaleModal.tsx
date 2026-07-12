'use client'

import { useForm }           from 'react-hook-form'
import { zodResolver }       from '@hookform/resolvers/zod'
import { z }                 from 'zod'
import { Loader2, AlertCircle, CalendarDays, Euro, Users, Plus, Trash2, UtensilsCrossed, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Modal }             from '@/components/ui/Modal'
import { cn }                from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────

type MenuDish = {
  id:         string
  dish_name:  string
  category:   string | null
  sell_price: number
}

type TicketLine = {
  dish:     MenuDish
  quantity: number
}

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  total_revenue: z.number().min(0, 'CA ≥ 0'),
  covers:        z.number().int().min(0, 'Couverts ≥ 0'),
})

type FormData = z.infer<typeof schema>

// ── Helpers UI ────────────────────────────────────────────────

function todayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

const labelCls = 'block text-[12px] font-semibold uppercase tracking-wide mb-1.5'
const inputCls = (hasError?: boolean) =>
  cn(
    'w-full h-[52px] rounded-[14px] border px-4 text-[15px] outline-none transition-all',
    'focus:ring-2',
    hasError
      ? 'border-red-400/40 bg-red-500/10 text-red-400 focus:border-red-400 focus:ring-red-400/20'
      : 'border-[var(--rp-lavender)] bg-[#111111] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20',
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
  onClose: () => void
  onSaved: () => void
}

// ── Composant ─────────────────────────────────────────────────

export function SaleModal({ onClose, onSaved }: SaleModalProps) {
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [stockWarnings, setStockWarnings] = useState<string[]>([])

  // Menu items fetched from API
  const [menuItems,     setMenuItems]     = useState<MenuDish[]>([])
  const [ticket,        setTicket]        = useState<TicketLine[]>([])
  const [selItemId,     setSelItemId]     = useState('')
  const [selQty,        setSelQty]        = useState(1)

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(j => setMenuItems(
        (j.items ?? [])
          .filter((i: MenuDish & { is_active: boolean }) => i.is_active)
      ))
      .catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date:          todayISO(),
      total_revenue: undefined,
      covers:        0,
    },
  })

  // Auto-compute revenue from ticket when items are added
  const ticketTotal = ticket.reduce((s, l) => s + l.dish.sell_price * l.quantity, 0)

  function handleAddToTicket() {
    const found = menuItems.find(m => m.id === selItemId)
    if (!found || selQty < 1) return
    setTicket(prev => {
      const existing = prev.find(l => l.dish.id === selItemId)
      if (existing) {
        return prev.map(l =>
          l.dish.id === selItemId
            ? { ...l, quantity: l.quantity + selQty }
            : l
        )
      }
      return [...prev, { dish: found, quantity: selQty }]
    })
    setSelItemId('')
    setSelQty(1)
  }

  function handleRemoveLine(id: string) {
    setTicket(prev => prev.filter(l => l.dish.id !== id))
  }

  // Sync ticket total → revenue field
  useEffect(() => {
    if (ticket.length > 0) {
      setValue('total_revenue', parseFloat(ticketTotal.toFixed(2)))
    }
  }, [ticket, ticketTotal, setValue])

  async function onSubmit(data: FormData) {
    setServerError(null)
    setStockWarnings([])
    try {
      // 1. Save sale (+ lignes de vente pour le top plats / historique)
      const res = await fetch('/api/sales', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...data,
          items: ticket.map(l => ({
            menu_item_id: l.dish.id,
            dish_name:    l.dish.dish_name,
            quantity:     l.quantity,
            unit_price:   l.dish.sell_price,
          })),
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? `Erreur ${res.status}`)
        return
      }

      // 2. Deduct stock for each dish in ticket
      if (ticket.length > 0) {
        const deductRes = await fetch('/api/sales/deduct-stock', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            items: ticket.map(l => ({
              menu_item_id: l.dish.id,
              quantity:     l.quantity,
            })),
          }),
        })
        if (deductRes.ok) {
          const dj = await deductRes.json()
          if (dj.warnings?.length) {
            setStockWarnings(dj.warnings)
            // Show warnings but still close after a delay
            onSaved()
            setTimeout(onClose, 3000)
            return
          }
        }
      }

      onSaved()
      onClose()
    } catch {
      setServerError('Erreur réseau. Veuillez réessayer.')
    }
  }

  const availableItems = menuItems.filter(m => !ticket.some(l => l.dish.id === m.id))

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 h-[48px] rounded-full border text-[14px] font-medium transition hover:bg-white/5"
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

      {stockWarnings.length > 0 && (
        <div className="mb-5 rounded-xl px-4 py-3 text-[13px] bg-amber-500/10 border border-amber-500/20">
          {stockWarnings.map((w, i) => (
            <p key={i} className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {w}
            </p>
          ))}
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

        {/* ── Plats vendus ── */}
        {menuItems.length > 0 && (
          <div>
            <label
              className={labelCls}
              style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Plats vendus (optionnel)
              </span>
            </label>

            {/* Ticket lines */}
            {ticket.length > 0 && (
              <div className="mb-3 space-y-2">
                {ticket.map(line => (
                  <div
                    key={line.dish.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                    style={{ borderColor: 'var(--rp-lavender)', background: 'white' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--rp-navy)' }}>
                        {line.dish.dish_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
                        × {line.quantity} · {(line.dish.sell_price * line.quantity).toFixed(2)} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.dish.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pr-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--rp-navy-muted)' }}>
                    Sous-total : {ticketTotal.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}

            {/* Add dish row */}
            {availableItems.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selItemId}
                  onChange={e => setSelItemId(e.target.value)}
                  className={cn(inputCls(), 'flex-1 h-[44px]')}
                >
                  <option value="">— Ajouter un plat —</option>
                  {availableItems.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.dish_name} ({m.sell_price.toFixed(2)} €)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={selQty}
                  onChange={e => setSelQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className={cn(inputCls(), 'w-16 h-[44px] text-center px-2')}
                />
                <button
                  type="button"
                  onClick={handleAddToTicket}
                  disabled={!selItemId}
                  className="h-[44px] px-3 rounded-[14px] text-white flex items-center justify-center transition disabled:opacity-40"
                  style={{ background: 'var(--rp-amber)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

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
