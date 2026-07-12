'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Loader2, AlertCircle, PackagePlus, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  product_id: z.string().uuid('Sélectionnez un produit'),
  quantity:   z.number().positive('Quantité positive requise'),
  note:       z.string().optional(),
  delivery_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
    hasError
      ? 'border-red-400 bg-red-500/10 focus:ring-2 focus:ring-red-400/20'
      : 'border-white/10 focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
  )

// ── Props ─────────────────────────────────────────────────────

type DeliveryModalProps = {
  products: Product[]
  /** Produit pré-sélectionné (depuis le tableau de stock) */
  preselectedProduct?: Product | null
  onClose: () => void
  onSaved: (updatedProduct: Product) => void
}

// ── Composant ─────────────────────────────────────────────────

export function DeliveryModal({
  products,
  preselectedProduct,
  onClose,
  onSaved,
}: DeliveryModalProps) {
  const [search, setSearch]           = useState('')
  const [selectedProduct, setSelected] = useState<Product | null>(preselectedProduct ?? null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [serverError, setServerError]  = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id:    preselectedProduct?.id ?? '',
      quantity:      undefined,
      delivery_date: today,
    },
  })

  // Filtrer les produits par la recherche
  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier_name ?? '').toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8),
    [products, search]
  )

  const selectProduct = (p: Product) => {
    setSelected(p)
    setValue('product_id', p.id)
    setSearch(p.name)
    setShowDropdown(false)
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/stock/movement', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: data.product_id,
          type:       'in',
          quantity:   data.quantity,
          note:       data.note
            ? `Livraison du ${data.delivery_date ?? today} — ${data.note}`
            : `Livraison du ${data.delivery_date ?? today}`,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Erreur lors de l'enregistrement.")
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
        type="button" onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit" form="delivery-form" disabled={isSubmitting || !selectedProduct}
        className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-2"
      >
        {isSubmitting
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <PackagePlus className="w-4 h-4" />
        }
        Enregistrer la livraison
      </button>
    </div>
  )

  return (
    <Modal title="Recevoir une livraison" onClose={onClose} footer={footer}>
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {serverError}
        </div>
      )}

      <form id="delivery-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Sélecteur de produit */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Produit <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              className={cn(
                'w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
                errors.product_id
                  ? 'border-red-400 bg-red-500/10 focus:ring-2 focus:ring-red-400/20'
                  : 'border-white/10 focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
              )}
            />
            {selectedProduct && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>

          {/* Dropdown résultats */}
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto w-full max-w-[calc(100%-2.5rem)]">
              {filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#7798AB]/10 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-white">{p.name}</span>
                    {p.category && (
                      <span className="ml-2 text-xs text-white/30">{p.category}</span>
                    )}
                  </div>
                  <span className="text-xs text-white/45 tabular-nums">
                    {p.stock_qty} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          )}

          <input type="hidden" {...register('product_id')} />
          {errors.product_id && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.product_id.message}
            </p>
          )}

          {/* Affichage stock actuel */}
          {selectedProduct && (
            <div className="mt-2 flex items-center gap-2 text-xs text-white/45 bg-white/5 rounded-lg px-3 py-2">
              <span>Stock actuel :</span>
              <span className="font-semibold text-white/70">
                {selectedProduct.stock_qty} {selectedProduct.unit}
              </span>
              {selectedProduct.min_threshold > 0 && (
                <>
                  <span className="text-white/30">·</span>
                  <span>Seuil min : {selectedProduct.min_threshold} {selectedProduct.unit}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quantité + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Quantité reçue <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
                className={inputCls(!!errors.quantity)}
              />
              {selectedProduct && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 pointer-events-none">
                  {selectedProduct.unit}
                </span>
              )}
            </div>
            {errors.quantity && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.quantity.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Date de livraison
            </label>
            <input
              type="date"
              {...register('delivery_date')}
              className={inputCls()}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Note (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex : BL n°12345, livraison Métro…"
            {...register('note')}
            className={inputCls()}
          />
        </div>
      </form>
    </Modal>
  )
}
