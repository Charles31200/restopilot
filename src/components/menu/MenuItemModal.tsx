'use client'

import { useState }        from 'react'
import { useForm }         from 'react-hook-form'
import { zodResolver }     from '@hookform/resolvers/zod'
import { z }               from 'zod'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { Modal }           from '@/components/ui/Modal'
import { cn }              from '@/lib/utils/cn'
import type { MenuRecipe } from './MenuClient'

const CATEGORIES = ['Entrée', 'Plat', 'Dessert', 'Boisson', 'Snack']

const schema = z.object({
  dish_name:  z.string().min(1, 'Nom requis'),
  category:   z.string().nullable().optional(),
  sell_price: z.number().min(0, 'Prix ≥ 0'),
  is_active:  z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

const labelCls = 'block text-[12px] font-semibold uppercase tracking-wide mb-1.5'
const inputCls = (hasError?: boolean) =>
  cn(
    'w-full h-[52px] rounded-[14px] border px-4 text-[15px] outline-none transition-all focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-500/10 text-red-700 focus:border-red-400 focus:ring-red-100'
      : 'border-[var(--rp-lavender)] bg-[#111111] text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20',
  )

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
    </p>
  )
}

type Props = {
  item?:      MenuRecipe | null
  onClose:    () => void
  onSaved:    (item: MenuRecipe) => void
  onDeleted?: (id: string) => void
}

export function MenuItemModal({ item, onClose, onSaved, onDeleted }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isDeleting,  setIsDeleting]  = useState(false)
  const isEdit = !!item?.id

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dish_name:  item?.dish_name  ?? '',
      category:   item?.category   ?? 'Plat',
      sell_price: item?.sell_price ?? undefined,
      is_active:  item?.is_active  ?? true,
    },
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      const res = await fetch(
        isEdit ? `/api/menu/${item!.id}` : '/api/menu',
        {
          method:  isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        }
      )
      const json = await res.json()
      if (!res.ok) { setServerError(json.error ?? `Erreur ${res.status}`); return }
      onSaved({
        ...json.item,
        recipe_ingredients: item?.recipe_ingredients ?? [],
      })
    } catch {
      setServerError('Erreur réseau. Veuillez réessayer.')
    }
  }

  async function handleDelete() {
    if (!item) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' })
      if (res.ok) { onDeleted?.(item.id) }
      else { const j = await res.json(); setServerError(j.error ?? 'Erreur') }
    } catch { setServerError('Erreur réseau.') }
    finally { setIsDeleting(false) }
  }

  const footer = (
    <div className="flex items-center gap-3">
      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 px-4 h-[48px] rounded-full text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 transition"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Supprimer
        </button>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClose}
        className="px-5 h-[48px] rounded-full border text-[14px] font-medium transition hover:bg-white/5"
        style={{ borderColor: 'var(--rp-lavender)', color: 'var(--rp-navy-muted)' }}
      >
        Annuler
      </button>
      <button
        type="submit"
        form="menu-item-form"
        disabled={isSubmitting}
        className="px-5 h-[48px] rounded-full text-[14px] font-semibold text-white flex items-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? 'Enregistrer' : 'Créer le plat'}
      </button>
    </div>
  )

  return (
    <Modal
      title={isEdit ? 'Modifier le plat' : 'Nouveau plat'}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={footer}
    >
      {serverError && (
        <div
          className="mb-5 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2"
          style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{serverError}
        </div>
      )}

      <form id="menu-item-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Nom */}
        <div>
          <label className={labelCls} style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
            Nom du plat *
          </label>
          <input
            type="text"
            placeholder="Ex : Entrecôte grillée"
            className={inputCls(!!errors.dish_name)}
            {...register('dish_name')}
          />
          <FieldError msg={errors.dish_name?.message} />
        </div>

        {/* Catégorie */}
        <div>
          <label className={labelCls} style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
            Catégorie
          </label>
          <select className={inputCls(!!errors.category)} {...register('category')}>
            <option value="">— Aucune —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError msg={errors.category?.message} />
        </div>

        {/* Prix de vente */}
        <div>
          <label className={labelCls} style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}>
            Prix de vente (€) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn(inputCls(!!errors.sell_price), 'pr-10')}
              {...register('sell_price', { valueAsNumber: true })}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium select-none"
              style={{ color: 'var(--rp-navy-muted)' }}
            >
              €
            </span>
          </div>
          <FieldError msg={errors.sell_price?.message} />
        </div>

        {/* Actif */}
        <div className="flex items-center gap-3">
          <input
            id="is_active"
            type="checkbox"
            className="w-4 h-4 rounded accent-[var(--rp-amber)]"
            {...register('is_active')}
          />
          <label
            htmlFor="is_active"
            className="text-sm font-medium cursor-pointer"
            style={{ color: 'var(--rp-navy)' }}
          >
            Plat actif (visible sur la carte)
          </label>
        </div>
      </form>
    </Modal>
  )
}
