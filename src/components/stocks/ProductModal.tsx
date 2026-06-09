'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  name:          z.string().min(2, 'Minimum 2 caractères'),
  category:      z.string().optional(),
  unit:          z.enum(['kg', 'g', 'L', 'cl', 'piece', 'boite', 'carton']),
  // z.number() + valueAsNumber: true dans register() → pas de coerce nécessaire
  buy_price:     z.number().min(0, 'Prix ≥ 0'),
  stock_qty:     z.number().min(0, 'Stock ≥ 0'),
  min_threshold: z.number().min(0, 'Seuil ≥ 0'),
  supplier_name: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Options ───────────────────────────────────────────────────

const CATEGORIES = [
  'Viandes', 'Poissons & fruits de mer', 'Légumes & fruits',
  'Produits laitiers', 'Épicerie sèche', 'Boissons',
  'Condiments & sauces', 'Autre',
]

const UNITS: { value: string; label: string }[] = [
  { value: 'kg',     label: 'Kilogramme (kg)' },
  { value: 'g',      label: 'Gramme (g)'       },
  { value: 'L',      label: 'Litre (L)'         },
  { value: 'cl',     label: 'Centilitre (cl)'   },
  { value: 'piece',  label: 'Pièce'             },
  { value: 'boite',  label: 'Boîte'             },
  { value: 'carton', label: 'Carton'            },
]

// ── Helpers UI ────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
    hasError
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  )

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {msg}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────

type ProductModalProps = {
  product?: Product | null    // null = création
  onClose:  () => void
  onSaved:  (product: Product) => void
}

// ── Composant ─────────────────────────────────────────────────

export function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!product?.id

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:          product?.name          ?? '',
      category:      product?.category      ?? '',
      unit:          (product?.unit         ?? 'piece') as FormData['unit'],
      buy_price:     product?.buy_price     ?? 0,
      stock_qty:     product?.stock_qty     ?? 0,
      min_threshold: product?.min_threshold ?? 0,
      supplier_name: product?.supplier_name ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: product!.id } : data),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Une erreur est survenue.')
        return
      }
      onSaved(json.product)
    } catch {
      setServerError('Erreur réseau. Veuillez réessayer.')
    }
  }

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit"
        form="product-form"
        disabled={isSubmitting}
        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? 'Enregistrer' : 'Créer le produit'}
      </button>
    </div>
  )

  return (
    <Modal
      title={isEdit ? `Modifier — ${product!.name}` : 'Nouveau produit'}
      onClose={onClose}
      footer={footer}
    >
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {serverError}
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex : Farine T55"
            {...register('name')}
            className={inputCls(!!errors.name)}
          />
          <FieldError msg={errors.name?.message} />
        </div>

        {/* Catégorie + Unité */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catégorie
            </label>
            <select {...register('category')} className={inputCls()} defaultValue="">
              <option value="">— Sélectionner —</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unité <span className="text-red-500">*</span>
            </label>
            <select {...register('unit')} className={inputCls(!!errors.unit)}>
              {UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <FieldError msg={errors.unit?.message} />
          </div>
        </div>

        {/* Prix d'achat + Stock actuel */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prix d'achat HT (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('buy_price', { valueAsNumber: true })}
              className={inputCls(!!errors.buy_price)}
            />
            <FieldError msg={errors.buy_price?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stock actuel
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              {...register('stock_qty', { valueAsNumber: true })}
              className={inputCls(!!errors.stock_qty)}
            />
            <FieldError msg={errors.stock_qty?.message} />
          </div>
        </div>

        {/* Seuil minimum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Seuil minimum d'alerte
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="0"
            {...register('min_threshold', { valueAsNumber: true })}
            className={inputCls(!!errors.min_threshold)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Une alerte s'affichera quand le stock descend sous ce seuil.
          </p>
          <FieldError msg={errors.min_threshold?.message} />
        </div>

        {/* Fournisseur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fournisseur
          </label>
          <input
            type="text"
            placeholder="Ex : Métro, Pomona…"
            {...register('supplier_name')}
            className={inputCls()}
          />
        </div>
      </form>
    </Modal>
  )
}
