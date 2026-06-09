'use client'

import { useState, useMemo } from 'react'
import { Loader2, AlertCircle, ClipboardCheck, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'

// ── Types ─────────────────────────────────────────────────────

type InventoryLine = {
  product:      Product
  counted:      string   // valeur saisie (string pour contrôler le champ vide)
}

// ── Helpers ───────────────────────────────────────────────────

function formatQty(qty: number, decimals = 3): string {
  return parseFloat(qty.toFixed(decimals)).toString()
}

function VarianceBadge({ variance }: { variance: number }) {
  if (variance === 0) {
    return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" />0</span>
  }
  const abs = Math.abs(variance)
  const positive = variance > 0
  return (
    <span
      className={cn(
        'text-xs font-semibold flex items-center gap-0.5 tabular-nums',
        positive ? 'text-green-600' : 'text-red-600'
      )}
    >
      {positive
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />
      }
      {positive ? '+' : '-'}{formatQty(abs)}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────

type InventoryModalProps = {
  products: Product[]
  onClose:  () => void
  onSaved:  (updatedProducts: Product[]) => void
}

// ── Composant ─────────────────────────────────────────────────

export function InventoryModal({ products, onClose, onSaved }: InventoryModalProps) {
  const [lines, setLines]           = useState<InventoryLine[]>(
    products.map(p => ({ product: p, counted: '' }))
  )
  const [search, setSearch]         = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep]             = useState<'count' | 'confirm'>('count')

  const updateCounted = (productId: string, value: string) => {
    setLines(prev => prev.map(l =>
      l.product.id === productId ? { ...l, counted: value } : l
    ))
  }

  // Lignes filtrées par la recherche
  const filtered = useMemo(() =>
    lines.filter(l =>
      l.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.product.category ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [lines, search]
  )

  // Lignes avec une valeur saisie
  const changedLines = useMemo(() =>
    lines.filter(l => l.counted !== '' && parseFloat(l.counted) !== l.product.stock_qty),
    [lines]
  )

  // Soumission de l'inventaire
  const handleValidate = async () => {
    setIsLoading(true)
    setServerError(null)

    const adjustments = changedLines.map(l => ({
      product_id: l.product.id,
      type:       'adjust' as const,
      quantity:   parseFloat(l.counted),    // 'adjust' = nouvelle valeur absolue
      note:       `Inventaire du ${new Date().toLocaleDateString('fr-FR')}`,
    }))

    if (adjustments.length === 0) {
      onClose()
      return
    }

    const updatedProducts: Product[] = []
    const errors: string[] = []

    // Envoyer chaque ajustement séquentiellement
    for (const adj of adjustments) {
      try {
        const res = await fetch('/api/stock/movement', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adj),
        })
        const json = await res.json()
        if (!res.ok) {
          errors.push(json.error ?? `Erreur pour produit ${adj.product_id}`)
        } else {
          updatedProducts.push(json.product)
        }
      } catch {
        errors.push(`Erreur réseau pour produit ${adj.product_id}`)
      }
    }

    setIsLoading(false)

    if (errors.length > 0) {
      setServerError(`${errors.length} erreur(s) : ${errors.slice(0, 2).join(', ')}`)
    } else {
      onSaved(updatedProducts)
    }
  }

  const totalChanges = changedLines.length
  const negativeCount = changedLines.filter(
    l => parseFloat(l.counted) < l.product.stock_qty
  ).length

  const footer = step === 'count' ? (
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-500">
        {totalChanges > 0
          ? `${totalChanges} produit(s) modifié(s)`
          : 'Saisissez les quantités comptées'
        }
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => setStep('confirm')}
          disabled={totalChanges === 0}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <ClipboardCheck className="w-4 h-4" />
          Vérifier ({totalChanges})
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between">
      <button type="button" onClick={() => setStep('count')}
        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Retour
      </button>
      <button
        type="button"
        onClick={handleValidate}
        disabled={isLoading}
        className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
      >
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <ClipboardCheck className="w-4 h-4" />
        }
        Valider l'inventaire
      </button>
    </div>
  )

  return (
    <Modal
      title="Inventaire mensuel"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {serverError}
        </div>
      )}

      {/* ── Étape 1 : Saisie des quantités ── */}
      {step === 'count' && (
        <>
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer les produits…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* En-tête colonnes */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-2 pb-2 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>Produit</span>
            <span className="text-right w-24">Théorique</span>
            <span className="text-right w-28">Compté</span>
            <span className="text-right w-16">Écart</span>
          </div>

          {/* Lignes produits */}
          <div className="divide-y divide-gray-50 -mx-1">
            {filtered.map(({ product, counted }) => {
              const countedNum = counted !== '' ? parseFloat(counted) : null
              const variance = countedNum !== null ? countedNum - product.stock_qty : null

              return (
                <div
                  key={product.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-1 py-2.5"
                >
                  {/* Nom + catégorie */}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    {product.category && (
                      <p className="text-xs text-gray-400">{product.category}</p>
                    )}
                  </div>

                  {/* Stock théorique */}
                  <span className="text-sm text-gray-500 tabular-nums w-24 text-right">
                    {formatQty(product.stock_qty)} {product.unit}
                  </span>

                  {/* Champ saisie */}
                  <div className="relative w-28">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="—"
                      value={counted}
                      onChange={e => updateCounted(product.id, e.target.value)}
                      className={cn(
                        'w-full px-2.5 py-1.5 border rounded-lg text-sm text-right tabular-nums transition-all outline-none',
                        counted !== ''
                          ? 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                          : 'border-gray-300 focus:border-blue-400'
                      )}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                      {product.unit}
                    </span>
                  </div>

                  {/* Écart */}
                  <div className="w-16 flex justify-end">
                    {variance !== null
                      ? <VarianceBadge variance={variance} />
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Étape 2 : Récapitulatif avant validation ── */}
      {step === 'confirm' && (
        <div>
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-medium text-amber-800">
              Vérification avant validation
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {totalChanges} produit(s) seront ajustés.
              {negativeCount > 0 && ` · ${negativeCount} en baisse de stock.`}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {/* En-tête */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Produit</span>
              <span className="text-right w-24">Avant</span>
              <span className="text-right w-24">Après</span>
              <span className="text-right w-16">Écart</span>
            </div>

            {changedLines.map(({ product, counted }) => {
              const newQty = parseFloat(counted)
              const variance = newQty - product.stock_qty
              return (
                <div key={product.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2.5">
                  <span className="text-sm font-medium text-gray-800">{product.name}</span>
                  <span className="text-sm text-gray-500 tabular-nums w-24 text-right">
                    {formatQty(product.stock_qty)} {product.unit}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums w-24 text-right">
                    {formatQty(newQty)} {product.unit}
                  </span>
                  <div className="w-16 flex justify-end">
                    <VarianceBadge variance={variance} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Modal>
  )
}
