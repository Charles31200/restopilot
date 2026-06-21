'use client'

import { useState, useMemo } from 'react'
import { useRouter }         from 'next/navigation'
import {
  Plus, Search, UtensilsCrossed, ChevronRight,
  Pencil, Trash2, BookOpen, Euro, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { MenuItemModal }       from './MenuItemModal'
import { RecipeSheetModal }    from './RecipeSheetModal'

// ── Types ─────────────────────────────────────────────────────

export type MenuIngredient = {
  id:         string
  quantity:   number
  products:   { id: string; name: string; unit: string } | null
}

export type MenuItem = {
  id:                    string
  name:                  string
  category:              string
  price:                 number
  description:           string | null
  is_active:             boolean
  menu_item_ingredients: MenuIngredient[]
}

export type Product = {
  id:        string
  name:      string
  unit:      string
  stock_qty: number
}

type MenuClientProps = {
  initialItems: MenuItem[]
  products:     Product[]
}

// ── Category badge colors ─────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Entrée':    '#3B82F6',
  'Plat':      '#10B981',
  'Dessert':   '#8B5CF6',
  'Boisson':   '#F59E0B',
  'Snack':     '#EF4444',
}

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? '#64748B'
}

// ── Composant ─────────────────────────────────────────────────

export function MenuClient({ initialItems, products }: MenuClientProps) {
  const router = useRouter()
  const [items, setItems]         = useState<MenuItem[]>(initialItems)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState<string>('Tous')
  const [editItem, setEditItem]   = useState<MenuItem | null>(null)
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null)
  const [showNew, setShowNew]     = useState(false)

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category))].sort()
    return ['Tous', ...cats]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCat === 'Tous' || item.category === filterCat
      return matchSearch && matchCat
    })
  }, [items, search, filterCat])

  function handleItemSaved(saved: MenuItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setShowNew(false)
    setEditItem(null)
    router.refresh()
  }

  function handleItemDeleted(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setEditItem(null)
    router.refresh()
  }

  function handleIngredientsUpdated(menuItemId: string, ingredients: MenuIngredient[]) {
    setItems(prev => prev.map(i =>
      i.id === menuItemId ? { ...i, menu_item_ingredients: ingredients } : i
    ))
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
            >
              Menu & Recettes
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
              {items.length} plat{items.length !== 1 ? 's' : ''} · Fiches techniques et décrément automatique du stock
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-full text-sm font-semibold text-white transition active:scale-[0.98]"
            style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-body)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau plat</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        {/* ── Search + filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--rp-navy-muted)' }}
            />
            <input
              type="text"
              placeholder="Rechercher un plat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm outline-none transition-all focus:ring-2"
              style={{
                borderColor: 'var(--rp-lavender)',
                color: 'var(--rp-navy)',
                background: 'white',
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  'px-3 h-10 rounded-xl text-xs font-semibold transition border',
                )}
                style={{
                  background:  filterCat === cat ? (cat === 'Tous' ? 'var(--rp-navy)' : getCategoryColor(cat)) : 'white',
                  color:       filterCat === cat ? 'white' : 'var(--rp-navy-muted)',
                  borderColor: filterCat === cat ? 'transparent' : 'var(--rp-lavender)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--rp-lavender-light)' }}
            >
              <UtensilsCrossed className="w-8 h-8" style={{ color: 'var(--rp-navy-muted)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--rp-navy)' }}>
                {search || filterCat !== 'Tous' ? 'Aucun résultat' : 'Aucun plat pour l\'instant'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--rp-navy-muted)' }}>
                {search || filterCat !== 'Tous' ? 'Modifiez votre recherche' : 'Créez votre premier plat pour commencer'}
              </p>
            </div>
            {!search && filterCat === 'Tous' && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-2 px-5 h-10 rounded-full text-sm font-semibold text-white"
                style={{ background: 'var(--rp-amber)' }}
              >
                Créer un plat
              </button>
            )}
          </div>
        )}

        {/* ── Items grid ── */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={() => setEditItem(item)}
                onRecipe={() => setRecipeItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(showNew || editItem) && (
        <MenuItemModal
          item={editItem}
          onClose={() => { setShowNew(false); setEditItem(null) }}
          onSaved={handleItemSaved}
          onDeleted={handleItemDeleted}
        />
      )}

      {recipeItem && (
        <RecipeSheetModal
          item={recipeItem}
          products={products}
          onClose={() => setRecipeItem(null)}
          onUpdated={handleIngredientsUpdated}
        />
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────

function MenuItemCard({
  item,
  onEdit,
  onRecipe,
}: {
  item:     MenuItem
  onEdit:   () => void
  onRecipe: () => void
}) {
  const color = getCategoryColor(item.category)
  const ingCount = item.menu_item_ingredients?.length ?? 0

  return (
    <div
      className="group rounded-2xl border bg-white overflow-hidden transition hover:shadow-md"
      style={{ borderColor: 'var(--rp-lavender)' }}
    >
      {/* Color stripe */}
      <div className="h-1.5" style={{ background: color }} />

      <div className="p-4">
        {/* Category + active badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: `${color}18`, color }}
          >
            <Tag className="w-2.5 h-2.5" />
            {item.category}
          </span>
          {!item.is_active && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
              Inactif
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          className="font-semibold text-base leading-snug mb-1 truncate"
          style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
        >
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p
            className="text-xs leading-relaxed mb-3 line-clamp-2"
            style={{ color: 'var(--rp-navy-muted)' }}
          >
            {item.description}
          </p>
        )}

        {/* Price + ingredient count */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1">
            <Euro className="w-3.5 h-3.5" style={{ color: 'var(--rp-amber)' }} />
            <span
              className="text-base font-bold"
              style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
            >
              {item.price.toFixed(2)}
            </span>
          </div>
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--rp-navy-muted)' }}
          >
            <BookOpen className="w-3 h-3" />
            {ingCount} ingrédient{ingCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--rp-lavender)' }}>
          <button
            onClick={onRecipe}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition"
            style={{
              background: 'var(--rp-lavender-light)',
              color:      'var(--rp-navy)',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Fiche technique
            <ChevronRight className="w-3 h-3 ml-auto" />
          </button>
          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-gray-100"
            style={{ color: 'var(--rp-navy-muted)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
