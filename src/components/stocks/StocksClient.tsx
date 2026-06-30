'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Search, Plus, PackagePlus, ClipboardList,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, Truck, AlertTriangle,
  CheckCircle2, MinusCircle, ChevronLeft, ChevronRight,
  Loader2, History, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ProductModal }      from '@/components/stocks/ProductModal'
import { DeliveryModal }     from '@/components/stocks/DeliveryModal'
import { InventoryModal }    from '@/components/stocks/InventoryModal'
import { StockHistoryModal } from '@/components/stocks/StockHistoryModal'
import { RecipesPage }       from '@/components/stocks/RecipesPage'
import type { Product } from '@/types'
import type { StockStatus } from '@/app/api/products/route'

// ── Types ─────────────────────────────────────────────────────

type ProductWithStatus = Product & { status: StockStatus }

type SortField = 'name' | 'stock_qty' | 'buy_price' | 'category' | 'supplier_name'
type SortDir   = 'asc' | 'desc'
type ModalType = 'product' | 'delivery' | 'inventory' | 'history' | null

// ── Helpers visuels ───────────────────────────────────────────

const STATUS_CONFIG: Record<StockStatus, {
  label: string; color: string; icon: React.ReactNode
}> = {
  critical: {
    label: 'Critique',
    color: '#DC2626',
    icon:  <AlertTriangle className="w-3 h-3" />,
  },
  low: {
    label: 'Faible',
    color: '#D97706',
    icon:  <MinusCircle className="w-3 h-3" />,
  },
  ok: {
    label: 'OK',
    color: '#16A34A',
    icon:  <CheckCircle2 className="w-3 h-3" />,
  },
}

function StatusBadge({ status }: { status: StockStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
      style={{ borderColor: '#E5E5E5', color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3" style={{ color: '#CCCCCC' }} />
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3" style={{ color: '#111111' }} />
    : <ChevronDown className="w-3 h-3" style={{ color: '#111111' }} />
}

// ── Props ─────────────────────────────────────────────────────

type StocksClientProps = {
  initialProducts: ProductWithStatus[]
  initialCategories: string[]
  initialTotal: number
}

// ── Composant principal ───────────────────────────────────────

export function StocksClient({
  initialProducts,
  initialCategories,
  initialTotal,
}: StocksClientProps) {
  // ── Onglets ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'products' | 'recipes'>('products')

  // ── Données ─────────────────────────────────────────────
  const [products,   setProducts]   = useState<ProductWithStatus[]>(initialProducts)
  const [total,      setTotal]      = useState(initialTotal)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [isLoading,  setIsLoading]  = useState(false)

  // ── Filtres ──────────────────────────────────────────────
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('')
  const [status,   setStatus]   = useState('')
  const [sortCol,  setSortCol]  = useState<SortField>('name')
  const [sortDir,  setSortDir]  = useState<SortDir>('asc')
  const [page,     setPage]     = useState(1)
  const LIMIT = 20

  // ── Modaux ──────────────────────────────────────────────
  const [openModal,        setOpenModal]        = useState<ModalType>(null)
  const [selectedProduct,  setSelectedProduct]  = useState<Product | null>(null)
  const [deliveryProduct,  setDeliveryProduct]  = useState<Product | null>(null)
  const [deleteTarget,     setDeleteTarget]     = useState<Product | null>(null)
  const [isDeleting,       setIsDeleting]       = useState(false)

  // ── Fetch avec les filtres actuels ───────────────────────
  const fetchProducts = useCallback(async (opts?: {
    s?: string; cat?: string; st?: string
    col?: SortField; dir?: SortDir; pg?: number
  }) => {
    setIsLoading(true)
    const params = new URLSearchParams({
      search:   opts?.s   ?? search,
      category: opts?.cat ?? category,
      status:   opts?.st  ?? status,
      sort:     opts?.col ?? sortCol,
      dir:      opts?.dir ?? sortDir,
      page:     String(opts?.pg ?? page),
      limit:    String(LIMIT),
    })
    // Supprimer les params vides
    ;['search', 'category', 'status'].forEach(k => {
      if (!params.get(k)) params.delete(k)
    })

    try {
      const res  = await fetch(`/api/products?${params}`)
      const json = await res.json()
      setProducts(json.products ?? [])
      setTotal(json.total ?? 0)
      if (json.categories) setCategories(json.categories)
    } finally {
      setIsLoading(false)
    }
  }, [search, category, status, sortCol, sortDir, page])

  // Re-fetch quand les filtres changent (avec debounce sur la recherche)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProducts({ s: search, pg: 1 })
    }, 300)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
    fetchProducts({ cat: category, st: status, col: sortCol, dir: sortDir, pg: 1 })
  }, [category, status, sortCol, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tri ──────────────────────────────────────────────────
  const handleSort = (col: SortField) => {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  // ── Callbacks modal ──────────────────────────────────────
  const handleProductSaved = useCallback((saved: Product) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      const withStatus = { ...saved, status: getStatusLocal(saved) } as ProductWithStatus
      return idx >= 0
        ? prev.map(p => p.id === saved.id ? withStatus : p)
        : [withStatus, ...prev]
    })
    setOpenModal(null)
    setSelectedProduct(null)
  }, [])

  const handleDeliverySaved = useCallback((updated: Product) => {
    setProducts(prev => prev.map(p =>
      p.id === updated.id
        ? { ...updated, status: getStatusLocal(updated) } as ProductWithStatus
        : p
    ))
    setOpenModal(null)
    setDeliveryProduct(null)
  }, [])

  const handleInventorySaved = useCallback((updated: Product[]) => {
    const map = new Map(updated.map(p => [p.id, p]))
    setProducts(prev => prev.map(p =>
      map.has(p.id)
        ? { ...map.get(p.id)!, status: getStatusLocal(map.get(p.id)!) } as ProductWithStatus
        : p
    ))
    setOpenModal(null)
  }, [])

  // ── CSV export ──────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      const res  = await fetch('/api/products?limit=9999&sort=name&dir=asc')
      const json = await res.json()
      const all: ProductWithStatus[] = json.products ?? []
      const header = ['Nom', 'Catégorie', 'Stock actuel', 'Unité', 'Seuil minimum', 'Prix achat (€)', 'Fournisseur', 'Statut']
      const rows = all.map(p => [
        p.name,
        p.category ?? '',
        formatQty(p.stock_qty),
        p.unit,
        p.min_threshold > 0 ? formatQty(p.min_threshold) : '',
        p.buy_price > 0 ? p.buy_price.toFixed(2) : '',
        p.supplier_name ?? '',
        p.status,
      ])
      const csv = [header, ...rows].map(row =>
        row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `stocks_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silently fail */ }
  }

  const handleDelete = async (product: Product) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== product.id))
        setTotal(t => t - 1)
      }
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)
  const criticalCount = products.filter(p => p.status === 'critical').length

  return (
    <div className="space-y-4">
      {/* ── Onglets ── */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: '#E5E5E5' }}>
        {[
          { id: 'products', label: `Ingrédients${total > 0 ? ` (${total})` : ''}` },
          { id: 'recipes',  label: 'Fiches techniques' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={activeTab === tab.id
              ? { borderColor: '#111111', color: '#111111' }
              : { borderColor: 'transparent', color: '#888888' }}
          >
            {tab.label}
            {tab.id === 'products' && criticalCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                {criticalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Ingrédients ── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Barre d'actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#BBBBBB' }} />
              <input
                type="text"
                placeholder="Rechercher un produit…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-[10px] border text-sm outline-none transition-all"
                style={{ borderColor: '#E5E5E5', color: '#111111', background: '#FFFFFF' }}
              />
            </div>

            {/* Filtre catégorie */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-10 px-3 rounded-[10px] border text-sm outline-none min-w-[160px]"
              style={{ borderColor: '#E5E5E5', color: '#111111', background: '#FFFFFF' }}
            >
              <option value="">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Filtre statut */}
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-10 px-3 rounded-[10px] border text-sm outline-none min-w-[140px]"
              style={{ borderColor: '#E5E5E5', color: '#111111', background: '#FFFFFF' }}
            >
              <option value="">Tous statuts</option>
              <option value="critical">Critique</option>
              <option value="low">Faible</option>
              <option value="ok">OK</option>
            </select>

            <div className="flex-1" />

            {/* Boutons action */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-[10px] border transition-colors hover:bg-gray-50"
              style={{ color: '#111111', borderColor: '#E5E5E5', background: '#FFFFFF' }}
              title="Exporter en CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => { setSelectedProduct(null); setOpenModal('history') }}
              className="flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-[10px] border transition-colors hover:bg-gray-50"
              style={{ color: '#111111', borderColor: '#E5E5E5', background: '#FFFFFF' }}
            >
              <History className="w-4 h-4" />
              Historique
            </button>
            <button
              onClick={() => setOpenModal('inventory')}
              className="flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-[10px] border transition-colors hover:bg-gray-50"
              style={{ color: '#111111', borderColor: '#E5E5E5', background: '#FFFFFF' }}
            >
              <ClipboardList className="w-4 h-4" />
              Inventaire
            </button>
            <button
              onClick={() => { setDeliveryProduct(null); setOpenModal('delivery') }}
              className="flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-[10px] border transition-colors hover:bg-gray-50"
              style={{ color: '#111111', borderColor: '#E5E5E5', background: '#FFFFFF' }}
            >
              <Truck className="w-4 h-4" />
              Livraison
            </button>
            <button
              onClick={() => { setSelectedProduct(null); setOpenModal('product') }}
              className="flex items-center gap-2 h-10 px-4 text-sm font-medium text-white rounded-[10px] transition-colors"
              style={{ background: '#000000' }}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {/* Tableau */}
          <div className="rounded-[12px] overflow-hidden" style={{ border: '1px solid #E5E5E5', background: '#FFFFFF' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                    {([
                      { key: 'name',          label: 'Nom'          },
                      { key: 'category',      label: 'Catégorie'    },
                      { key: 'stock_qty',     label: 'Stock actuel' },
                      { key: null,            label: 'Seuil min'    },
                      { key: null,            label: 'Statut'       },
                      { key: 'supplier_name', label: 'Fournisseur'  },
                      { key: null,            label: ''             },
                    ] as { key: SortField | null; label: string }[]).map((col, i) => (
                      <th
                        key={i}
                        className={cn(
                          'px-4 py-3 text-left text-[12px] font-medium whitespace-nowrap',
                          col.key && 'cursor-pointer select-none'
                        )}
                        style={{ color: '#888888' }}
                        onClick={() => col.key && handleSort(col.key)}
                      >
                        <span className="flex items-center gap-1.5">
                          {col.label}
                          {col.key && (
                            <SortIcon col={col.key} active={sortCol === col.key} dir={sortDir} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#BBBBBB' }} />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <p className="text-sm" style={{ color: '#BBBBBB' }}>Aucun produit trouvé.</p>
                      </td>
                    </tr>
                  ) : products.map(product => (
                    <tr
                      key={product.id}
                      className="group transition-colors"
                      style={{
                        borderBottom: '1px solid #F0F0F0',
                        background: product.status === 'critical' ? '#FEF2F2' : 'transparent',
                      }}
                      onMouseEnter={e => { if (product.status !== 'critical') e.currentTarget.style.background = '#F7F7F7' }}
                      onMouseLeave={e => { if (product.status !== 'critical') e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#111111' }}>
                        {product.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap" style={{ borderColor: '#E5E5E5', color: '#333333' }}>
                          {product.category ?? 'Sans catégorie'}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: '#111111' }}>
                        {formatQty(product.stock_qty)} {product.unit}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: '#888888' }}>
                        {product.min_threshold > 0
                          ? `${formatQty(product.min_threshold)} ${product.unit}`
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3" style={{ color: '#888888' }}>
                        {product.supplier_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Commander — toujours visible pour les produits critiques */}
                          {product.status === 'critical' ? (
                            <button
                              onClick={() => { setDeliveryProduct(product); setOpenModal('delivery') }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                              title="Commander"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              Commander
                            </button>
                          ) : (
                            <button
                              onClick={() => { setDeliveryProduct(product); setOpenModal('delivery') }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Recevoir une livraison"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                          )}
                          {/* Historique */}
                          <button
                            onClick={() => { setSelectedProduct(product); setOpenModal('history') }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Historique des mouvements"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {/* Modifier */}
                          <button
                            onClick={() => { setSelectedProduct(product); setOpenModal('product') }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {/* Supprimer */}
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                <p className="text-xs" style={{ color: '#888888' }}>
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} sur {total} produits
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ color: '#888888' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs px-2" style={{ color: '#888888' }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ color: '#888888' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Onglet Fiches techniques ── */}
      {activeTab === 'recipes' && (
        <RecipesPage products={products} />
      )}

      {/* ── Modaux ── */}
      {openModal === 'product' && (
        <ProductModal
          product={selectedProduct}
          onClose={() => { setOpenModal(null); setSelectedProduct(null) }}
          onSaved={handleProductSaved}
        />
      )}
      {openModal === 'delivery' && (
        <DeliveryModal
          products={products}
          preselectedProduct={deliveryProduct}
          onClose={() => { setOpenModal(null); setDeliveryProduct(null) }}
          onSaved={handleDeliverySaved}
        />
      )}
      {openModal === 'inventory' && (
        <InventoryModal
          products={products}
          onClose={() => setOpenModal(null)}
          onSaved={handleInventorySaved}
        />
      )}
      {openModal === 'history' && (
        <StockHistoryModal
          product={selectedProduct}
          onClose={() => { setOpenModal(null); setSelectedProduct(null) }}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Supprimer ce produit ?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold">{deleteTarget.name}</span> sera définitivement supprimé.
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers locaux ────────────────────────────────────────────

function getStatusLocal(p: Product): StockStatus {
  if (p.min_threshold <= 0) return 'ok'
  if (p.stock_qty < p.min_threshold)     return 'critical'
  if (p.stock_qty < p.min_threshold * 2) return 'low'
  return 'ok'
}

function formatQty(qty: number): string {
  return parseFloat(qty.toFixed(3)).toString()
}
