'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2, Plus, AlertCircle, BookOpen, Package } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn }   from '@/lib/utils/cn'
import type { MenuItem, MenuIngredient, Product } from './MenuClient'

type Props = {
  item:       MenuItem
  products:   Product[]
  onClose:    () => void
  onUpdated:  (menuItemId: string, ingredients: MenuIngredient[]) => void
}

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full h-[44px] rounded-[12px] border px-3 text-[14px] outline-none transition-all focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
      : 'border-[var(--rp-lavender)] bg-white text-[var(--rp-navy)] focus:border-[var(--rp-amber)] focus:ring-[var(--rp-amber)]/20',
  )

export function RecipeSheetModal({ item, products, onClose, onUpdated }: Props) {
  const [ingredients, setIngredients] = useState<MenuIngredient[]>(item.menu_item_ingredients ?? [])
  const [isLoading,   setIsLoading]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  // Add form state
  const [addProductId, setAddProductId] = useState('')
  const [addQuantity,  setAddQuantity]  = useState('')
  const [addError,     setAddError]     = useState<string | null>(null)
  const [isAdding,     setIsAdding]     = useState(false)

  // Fetch latest ingredients on open
  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/menu/${item.id}/ingredients`)
      .then(r => r.json())
      .then(j => { if (j.ingredients) setIngredients(j.ingredients) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [item.id])

  const selectedProduct = products.find(p => p.id === addProductId)

  async function handleAdd() {
    setAddError(null)
    if (!addProductId) { setAddError('Sélectionnez un ingrédient'); return }
    const qty = parseFloat(addQuantity)
    if (!addQuantity || isNaN(qty) || qty <= 0) { setAddError('Quantité invalide'); return }

    setIsAdding(true)
    try {
      const res = await fetch(`/api/menu/${item.id}/ingredients`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ product_id: addProductId, quantity: qty }),
      })
      const json = await res.json()
      if (!res.ok) { setAddError(json.error ?? 'Erreur'); return }
      const next = [...ingredients, json.ingredient]
      setIngredients(next)
      onUpdated(item.id, next)
      setAddProductId('')
      setAddQuantity('')
    } catch {
      setAddError('Erreur réseau.')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(ingId: string) {
    setDeletingId(ingId)
    setServerError(null)
    try {
      const res = await fetch(`/api/menu/ingredients/${ingId}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); setServerError(j.error ?? 'Erreur'); return }
      const next = ingredients.filter(i => i.id !== ingId)
      setIngredients(next)
      onUpdated(item.id, next)
    } catch {
      setServerError('Erreur réseau.')
    } finally {
      setDeletingId(null)
    }
  }

  // Products not yet linked
  const availableProducts = products.filter(
    p => !ingredients.some(i => i.products?.id === p.id)
  )

  const footer = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="px-6 h-[48px] rounded-full text-[14px] font-semibold text-white transition active:scale-[0.98]"
        style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
      >
        Fermer
      </button>
    </div>
  )

  return (
    <Modal
      title={`Fiche technique — ${item.name}`}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={footer}
    >
      {serverError && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2"
          style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      {/* ── Ingredients list ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4" style={{ color: 'var(--rp-navy-muted)' }} />
          <span
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            Ingrédients ({ingredients.length})
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--rp-amber)' }} />
          </div>
        ) : ingredients.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed gap-2"
            style={{ borderColor: 'var(--rp-lavender)' }}
          >
            <Package className="w-8 h-8" style={{ color: 'var(--rp-lavender)' }} />
            <p className="text-sm" style={{ color: 'var(--rp-navy-muted)' }}>
              Aucun ingrédient lié
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ingredients.map(ing => {
              const prod = ing.products
              return (
                <div
                  key={ing.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ borderColor: 'var(--rp-lavender)', background: 'white' }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--rp-navy)' }}
                    >
                      {prod?.name ?? '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
                      {ing.quantity} {prod?.unit ?? ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(ing.id)}
                    disabled={deletingId === ing.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-red-50 disabled:opacity-60"
                    style={{ color: '#EF4444' }}
                    aria-label="Supprimer"
                  >
                    {deletingId === ing.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add ingredient ── */}
      <div
        className="rounded-2xl p-4 border"
        style={{ borderColor: 'var(--rp-lavender)', background: 'var(--rp-lavender-light)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4" style={{ color: 'var(--rp-navy-muted)' }} />
          <span
            className="text-[12px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--rp-navy-muted)', fontFamily: 'var(--font-body)' }}
          >
            Ajouter un ingrédient
          </span>
        </div>

        {addError && (
          <p className="mb-3 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {addError}
          </p>
        )}

        <div className="flex gap-2">
          {/* Product dropdown */}
          <select
            value={addProductId}
            onChange={e => { setAddProductId(e.target.value); setAddError(null) }}
            className={cn(inputCls(), 'flex-1')}
          >
            <option value="">— Choisir un ingrédient —</option>
            {availableProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>

          {/* Quantity */}
          <div className="w-28 relative">
            <input
              type="number"
              step="1"
              min="1"
              placeholder="Qté"
              value={addQuantity}
              onChange={e => { setAddQuantity(e.target.value); setAddError(null) }}
              className={inputCls()}
            />
            {selectedProduct && (
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium select-none pointer-events-none"
                style={{ color: 'var(--rp-navy-muted)' }}
              >
                {selectedProduct.unit}
              </span>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="h-[44px] px-4 rounded-[12px] font-semibold text-white text-sm flex items-center gap-1.5 transition active:scale-[0.97] disabled:opacity-60"
            style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-body)' }}
          >
            {isAdding
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />
            }
          </button>
        </div>

        {availableProducts.length === 0 && !isLoading && (
          <p className="mt-2 text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
            Tous vos produits sont déjà liés à ce plat.
          </p>
        )}
      </div>
    </Modal>
  )
}
