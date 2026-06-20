'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, TrendingDown, SlidersHorizontal, ShoppingCart, History } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'

// ── Types ─────────────────────────────────────────────────────

type Movement = {
  id:         string
  product_id: string
  type:       'in' | 'out' | 'adjust' | 'sale'
  quantity:   number
  note:       string | null
  created_at: string
  products:   { name: string; unit: string } | null
}

// ── Config visuelle par type ──────────────────────────────────

const TYPE_CONFIG: Record<Movement['type'], {
  label: string; icon: React.ReactNode; cls: string
}> = {
  in: {
    label: 'Livraison',
    icon:  <TrendingUp className="w-3.5 h-3.5" />,
    cls:   'bg-green-100 text-green-700',
  },
  out: {
    label: 'Sortie',
    icon:  <TrendingDown className="w-3.5 h-3.5" />,
    cls:   'bg-red-100 text-red-700',
  },
  adjust: {
    label: 'Inventaire',
    icon:  <SlidersHorizontal className="w-3.5 h-3.5" />,
    cls:   'bg-blue-100 text-blue-700',
  },
  sale: {
    label: 'Vente',
    icon:  <ShoppingCart className="w-3.5 h-3.5" />,
    cls:   'bg-amber-100 text-amber-700',
  },
}

// ── Props ─────────────────────────────────────────────────────

type StockHistoryModalProps = {
  product?: Product | null  // null = historique global
  onClose:  () => void
}

// ── Composant ─────────────────────────────────────────────────

export function StockHistoryModal({ product, onClose }: StockHistoryModalProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ limit: '50' })
        if (product?.id) params.set('product_id', product.id)
        const res  = await fetch(`/api/stock/movement?${params}`)
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Erreur'); return }
        setMovements(json.movements ?? [])
      } catch {
        setError('Erreur réseau.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [product?.id])

  const title = product
    ? `Historique — ${product.name}`
    : 'Historique des mouvements'

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-xl">
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-500">{error}</div>
      ) : movements.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
          <History className="w-8 h-8" />
          <p className="text-sm">Aucun mouvement enregistré.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 -mx-1">
          {movements.map(m => {
            const cfg    = TYPE_CONFIG[m.type]
            const isPos  = m.quantity > 0
            const date   = new Date(m.created_at).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            const time   = new Date(m.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit', minute: '2-digit',
            })
            const unit   = m.products?.unit ?? product?.unit ?? ''
            const productName = !product && m.products?.name

            return (
              <div key={m.id} className="flex items-start gap-3 px-1 py-3">
                {/* Badge type */}
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 mt-0.5',
                  cfg.cls
                )}>
                  {cfg.icon}
                  {cfg.label}
                </span>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  {productName && (
                    <p className="text-sm font-medium text-gray-800 truncate">{productName}</p>
                  )}
                  {m.note && (
                    <p className="text-xs text-gray-500 truncate">{m.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{date} à {time}</p>
                </div>

                {/* Quantité */}
                <span className={cn(
                  'text-sm font-bold tabular-nums flex-shrink-0',
                  isPos ? 'text-green-600' : 'text-red-600'
                )}>
                  {isPos ? '+' : ''}{parseFloat(m.quantity.toFixed(3))} {unit}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
