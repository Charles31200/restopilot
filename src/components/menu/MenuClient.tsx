'use client'

import { useState, useMemo } from 'react'
import { useRouter }         from 'next/navigation'
import {
  Plus, Search, UtensilsCrossed, ChevronRight, Filter,
  Pencil, BookOpen, Euro, Tag, List, LayoutGrid, MoreHorizontal,
} from 'lucide-react'
import { MenuItemModal }    from './MenuItemModal'
import { RecipeSheetModal } from './RecipeSheetModal'

type ViewMode = 'table' | 'grid'

// ── Types (mapped to real DB columns) ────────────────────────

export type MenuIngredient = {
  id:         string
  quantity:   number
  products:   { id: string; name: string; unit: string } | null
}

export type MenuRecipe = {
  id:                  string
  dish_name:           string
  category:            string | null
  sell_price:          number
  is_active:           boolean
  created_at?:         string
  recipe_ingredients:  MenuIngredient[]
}

export type MenuProduct = {
  id:        string
  name:      string
  unit:      string
  stock_qty: number
}

type MenuClientProps = {
  initialItems: MenuRecipe[]
  products:     MenuProduct[]
}

// ── Category badge colors ─────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Entrée':    '#3B82F6',
  'Plat':      '#10B981',
  'Dessert':   '#8B5CF6',
  'Boisson':   '#F59E0B',
  'Snack':     '#EF4444',
}

function getCategoryColor(cat: string | null) {
  return cat ? (CATEGORY_COLORS[cat] ?? '#64748B') : '#64748B'
}

// ── Composant ─────────────────────────────────────────────────

export function MenuClient({ initialItems, products }: MenuClientProps) {
  const router = useRouter()
  const [items, setItems]           = useState<MenuRecipe[]>(initialItems)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState<string>('Tous')
  const [filterOpen, setFilterOpen] = useState(false)
  const [view, setView]             = useState<ViewMode>('table')
  const [editItem, setEditItem]     = useState<MenuRecipe | null>(null)
  const [recipeItem, setRecipeItem] = useState<MenuRecipe | null>(null)
  const [showNew, setShowNew]       = useState(false)

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category ?? 'Sans catégorie'))].sort()
    return ['Tous', ...cats]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.dish_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category ?? '').toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCat === 'Tous' || (item.category ?? 'Sans catégorie') === filterCat
      return matchSearch && matchCat
    })
  }, [items, search, filterCat])

  function handleItemSaved(saved: MenuRecipe) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = saved; return next
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

  function handleIngredientsUpdated(recipeId: string, ingredients: MenuIngredient[]) {
    setItems(prev => prev.map(i =>
      i.id === recipeId ? { ...i, recipe_ingredients: ingredients } : i
    ))
    // keep recipeItem in sync so RecipeSheetModal shows updated list
    setRecipeItem(prev => prev?.id === recipeId ? { ...prev, recipe_ingredients: ingredients } : prev)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#111111', fontFamily: 'var(--font-display)' }}>
              Menu & Recettes
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#888888' }}>
              {items.length} plat{items.length !== 1 ? 's' : ''} · Fiches techniques et décrément automatique du stock
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-[8px] text-sm font-semibold text-white transition active:scale-[0.98]"
            style={{ background: '#000000', fontFamily: 'var(--font-body)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau plat</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>

        {/* ── Search + filter + vue ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#BBBBBB' }} />
            <input
              type="text"
              placeholder="Rechercher un plat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-[10px] border text-sm outline-none transition-all"
              style={{ borderColor: '#E5E5E5', color: '#111111', background: '#FFFFFF' }}
            />
          </div>

          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 h-10 px-3.5 rounded-[10px] border text-sm font-medium transition"
            style={{
              borderColor: filterOpen || filterCat !== 'Tous' ? '#111111' : '#E5E5E5',
              color:       filterOpen || filterCat !== 'Tous' ? '#111111' : '#888888',
              background:  '#FFFFFF',
            }}
          >
            <Filter className="w-4 h-4" />
            Filtrer
            {filterCat !== 'Tous' && (
              <span className="rp-tag" style={{ background: '#111111', color: '#FFFFFF' }}>{filterCat}</span>
            )}
          </button>

          <div className="flex items-center gap-0.5 rounded-[10px] p-1" style={{ background: '#F5F5F5' }}>
            <button
              onClick={() => setView('table')}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition"
              style={view === 'table' ? { background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : undefined}
              aria-label="Vue tableau"
            >
              <List className="w-4 h-4" style={{ color: view === 'table' ? '#111111' : '#888888' }} />
            </button>
            <button
              onClick={() => setView('grid')}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition"
              style={view === 'grid' ? { background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : undefined}
              aria-label="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" style={{ color: view === 'grid' ? '#111111' : '#888888' }} />
            </button>
          </div>
        </div>

        {/* ── Chips catégories (repliable) ── */}
        {filterOpen && (
          <div className="flex gap-2 flex-wrap -mt-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className="px-3 h-8 rounded-[8px] text-xs font-semibold transition border"
                style={{
                  background:  filterCat === cat ? '#111111' : '#FFFFFF',
                  color:       filterCat === cat ? '#FFFFFF' : '#888888',
                  borderColor: filterCat === cat ? '#111111' : '#E5E5E5',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#F5F5F5' }}>
              <UtensilsCrossed className="w-8 h-8" style={{ color: '#BBBBBB' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#111111' }}>
                {search || filterCat !== 'Tous' ? 'Aucun résultat' : 'Aucun plat pour l\'instant'}
              </p>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>
                {search || filterCat !== 'Tous' ? 'Modifiez votre recherche' : 'Créez votre premier plat pour commencer'}
              </p>
            </div>
            {!search && filterCat === 'Tous' && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-2 px-5 h-10 rounded-[8px] text-sm font-semibold text-white"
                style={{ background: '#000000' }}
              >
                Créer un plat
              </button>
            )}
          </div>
        )}

        {/* ── Tableau ── */}
        {filtered.length > 0 && view === 'table' && (
          <MenuTable items={filtered} onEdit={setEditItem} onRecipe={setRecipeItem} />
        )}

        {/* ── Grille (alternative) ── */}
        {filtered.length > 0 && view === 'grid' && (
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
  item, onEdit, onRecipe,
}: { item: MenuRecipe; onEdit: () => void; onRecipe: () => void }) {
  const color      = getCategoryColor(item.category)
  const ingCount   = item.recipe_ingredients?.length ?? 0

  return (
    <div
      className="group rounded-2xl border bg-white overflow-hidden transition hover:shadow-md"
      style={{ borderColor: 'var(--rp-lavender)' }}
    >
      <div className="h-1.5" style={{ background: color }} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: `${color}18`, color }}
          >
            <Tag className="w-2.5 h-2.5" />
            {item.category ?? 'Sans catégorie'}
          </span>
          {!item.is_active && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
              Inactif
            </span>
          )}
        </div>

        <h3
          className="font-semibold text-base leading-snug mb-3 truncate"
          style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
        >
          {item.dish_name}
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Euro className="w-3.5 h-3.5" style={{ color: 'var(--rp-amber)' }} />
            <span className="text-base font-bold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
              {item.sell_price.toFixed(2)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
            <BookOpen className="w-3 h-3" />
            {ingCount} ingrédient{ingCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--rp-lavender)' }}>
          <button
            onClick={onRecipe}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition"
            style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
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

// ── Tableau (style "Task app") ──────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function MenuTable({
  items, onEdit, onRecipe,
}: { items: MenuRecipe[]; onEdit: (item: MenuRecipe) => void; onRecipe: (item: MenuRecipe) => void }) {
  return (
    <div className="rounded-[12px] overflow-hidden" style={{ border: '1px solid #E5E5E5' }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
            <th className="text-left text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}>Prix</th>
            <th className="text-left text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}>Plat</th>
            <th className="text-left text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}>Catégorie</th>
            <th className="text-left text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}>Statut</th>
            <th className="text-left text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}>Créé le</th>
            <th className="text-right text-[12px] font-medium px-4 py-3" style={{ color: '#888888' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const color    = getCategoryColor(item.category)
            const ingCount = item.recipe_ingredients?.length ?? 0
            return (
              <tr
                key={item.id}
                onClick={() => onRecipe(item)}
                className="cursor-pointer transition-colors group"
                style={{ borderBottom: '1px solid #F0F0F0' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F7F7F7')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-4 py-3 text-[13px] tabular-nums whitespace-nowrap" style={{ color: '#888888' }}>
                  {fmtPrice(item.sell_price)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-[14px] font-medium" style={{ color: '#111111' }}>{item.dish_name}</p>
                  <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: '#BBBBBB' }}>
                    <BookOpen className="w-3 h-3" />
                    {ingCount} ingrédient{ingCount !== 1 ? 's' : ''}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap" style={{ borderColor: '#E5E5E5', color: '#333333' }}>
                    {item.category ?? 'Sans catégorie'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-[6px] border px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
                    style={item.is_active
                      ? { borderColor: '#E5E5E5', color: '#16A34A' }
                      : { borderColor: '#E5E5E5', color: '#BBBBBB' }}
                  >
                    {item.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] whitespace-nowrap" style={{ color: '#888888' }}>
                  {fmtDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                      style={{ background: color }}
                      title={item.dish_name}
                    >
                      {item.dish_name.slice(0, 2).toUpperCase()}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(item) }}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center transition hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                      style={{ color: '#888888' }}
                      aria-label="Modifier"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
