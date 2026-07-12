'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  PlusCircle, Trash2, ChefHat, Loader2, AlertCircle,
  Euro, X, Search, Check,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'
import type { RecipeWithFoodCost } from '@/app/api/recipes/route'

// ── Liste des 115 ingrédients courants ────────────────────────

type IngredientSuggestion = { name: string; unit: string; category: string }

const COMMON_INGREDIENTS: IngredientSuggestion[] = [
  // Viandes
  { name: 'Bœuf haché',        unit: 'kg', category: 'Viandes' },
  { name: 'Entrecôte de bœuf', unit: 'kg', category: 'Viandes' },
  { name: 'Filet de bœuf',     unit: 'kg', category: 'Viandes' },
  { name: 'Bavette de bœuf',   unit: 'kg', category: 'Viandes' },
  { name: 'Blanc de poulet',   unit: 'kg', category: 'Viandes' },
  { name: 'Cuisse de poulet',  unit: 'kg', category: 'Viandes' },
  { name: 'Poulet entier',     unit: 'kg', category: 'Viandes' },
  { name: 'Lardons',           unit: 'kg', category: 'Viandes' },
  { name: 'Jambon blanc',      unit: 'kg', category: 'Viandes' },
  { name: 'Jambon cru',        unit: 'kg', category: 'Viandes' },
  { name: 'Côte de porc',      unit: 'kg', category: 'Viandes' },
  { name: 'Filet mignon porc', unit: 'kg', category: 'Viandes' },
  { name: 'Saucisse',          unit: 'kg', category: 'Viandes' },
  { name: 'Chorizo',           unit: 'kg', category: 'Viandes' },
  { name: 'Magret de canard',  unit: 'kg', category: 'Viandes' },
  { name: 'Foie gras',         unit: 'kg', category: 'Viandes' },
  { name: 'Escalope de veau',  unit: 'kg', category: 'Viandes' },
  { name: 'Gigot d\'agneau',   unit: 'kg', category: 'Viandes' },
  { name: 'Merguez',           unit: 'kg', category: 'Viandes' },
  // Poissons & fruits de mer
  { name: 'Saumon',            unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Cabillaud',         unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Thon',              unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Bar',               unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Daurade',           unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Dorade royale',     unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Sole',              unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Sardines',          unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Crevettes',         unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Moules',            unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Noix de Saint-Jacques', unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Calamars',          unit: 'kg', category: 'Poissons & fruits de mer' },
  { name: 'Homard',            unit: 'kg', category: 'Poissons & fruits de mer' },
  // Légumes
  { name: 'Tomates',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Tomates cerises',   unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Oignons',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Ail',               unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Échalotes',         unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Pommes de terre',   unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Carottes',          unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Courgettes',        unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Aubergines',        unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Poivrons rouges',   unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Poivrons verts',    unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Champignons',       unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Épinards',          unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Salade verte',      unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Haricots verts',    unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Petits pois',       unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Brocoli',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Chou-fleur',        unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Poireaux',          unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Céleri',            unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Fenouil',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Asperges',          unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Betterave',         unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Avocat',            unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Citrons',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Citrons verts',     unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Oranges',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Pommes',            unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Poires',            unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Framboises',        unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Fraises',           unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Mangue',            unit: 'kg', category: 'Légumes & fruits' },
  { name: 'Ananas',            unit: 'kg', category: 'Légumes & fruits' },
  // Produits laitiers
  { name: 'Beurre',            unit: 'kg', category: 'Produits laitiers' },
  { name: 'Crème liquide 35%', unit: 'L',  category: 'Produits laitiers' },
  { name: 'Crème fraîche',     unit: 'kg', category: 'Produits laitiers' },
  { name: 'Lait entier',       unit: 'L',  category: 'Produits laitiers' },
  { name: 'Gruyère râpé',      unit: 'kg', category: 'Produits laitiers' },
  { name: 'Parmesan',          unit: 'kg', category: 'Produits laitiers' },
  { name: 'Mozzarella',        unit: 'kg', category: 'Produits laitiers' },
  { name: 'Roquefort',         unit: 'kg', category: 'Produits laitiers' },
  { name: 'Camembert',         unit: 'kg', category: 'Produits laitiers' },
  { name: 'Chèvre frais',      unit: 'kg', category: 'Produits laitiers' },
  { name: 'Mascarpone',        unit: 'kg', category: 'Produits laitiers' },
  { name: 'Yaourt nature',     unit: 'kg', category: 'Produits laitiers' },
  { name: 'Œufs',              unit: 'piece', category: 'Produits laitiers' },
  // Épicerie sèche
  { name: 'Farine T55',        unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Farine T45',        unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Sucre en poudre',   unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Sucre glace',       unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Sel fin',           unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Riz basmati',       unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Riz rond',          unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Pâtes tagliatelles',unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Pâtes spaghettis',  unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Pâtes penne',       unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Huile d\'olive',    unit: 'L',  category: 'Épicerie sèche' },
  { name: 'Huile de tournesol',unit: 'L',  category: 'Épicerie sèche' },
  { name: 'Vinaigre balsamique',unit: 'L', category: 'Épicerie sèche' },
  { name: 'Vinaigre de vin',   unit: 'L',  category: 'Épicerie sèche' },
  { name: 'Moutarde de Dijon', unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Concentré de tomates',unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Tomates pelées',    unit: 'boite', category: 'Épicerie sèche' },
  { name: 'Cornichons',        unit: 'boite', category: 'Épicerie sèche' },
  { name: 'Olives noires',     unit: 'kg', category: 'Épicerie sèche' },
  { name: 'Levure boulangère', unit: 'kg', category: 'Épicerie sèche' },
  // Épices & herbes
  { name: 'Poivre noir',       unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Paprika',           unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Cumin',             unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Curry',             unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Curcuma',           unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Thym',              unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Romarin',           unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Basilic frais',     unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Persil frais',      unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Coriandre fraîche', unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Estragon',          unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Ciboulette',        unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Muscade',           unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Piment d\'Espelette',unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Sauce soja',        unit: 'L',  category: 'Condiments & sauces' },
  { name: 'Fond de veau',      unit: 'L',  category: 'Condiments & sauces' },
  { name: 'Bouillon de volaille',unit: 'L', category: 'Condiments & sauces' },
  { name: 'Mayonnaise',        unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Ketchup',           unit: 'kg', category: 'Condiments & sauces' },
  { name: 'Huile de sésame',   unit: 'cl', category: 'Condiments & sauces' },
]

// ── Schéma formulaire recette ─────────────────────────────────

const schema = z.object({
  id:         z.string().uuid().optional(),
  dish_name:  z.string().min(2, 'Nom du plat requis'),
  sell_price: z.number().positive('Prix de vente requis'),
  category:   z.string().optional(),
  ingredients: z.array(z.object({
    product_id: z.string().uuid('Produit requis'),
    quantity:   z.number().positive('Quantité > 0'),
  })).min(1, 'Au moins 1 ingrédient requis'),
})

type FormData = z.infer<typeof schema>

// ── Helpers visuels ───────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    'w-full px-3 py-2 border rounded-lg text-sm transition-all outline-none',
    hasError
      ? 'border-red-400 bg-red-500/10 focus:ring-2 focus:ring-red-400/20'
      : 'border-white/10 focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
  )

function FoodCostBadge({ pct }: { pct: number }) {
  const color = pct < 30 ? 'bg-green-50 text-green-700' :
                pct < 40 ? 'bg-amber-50 text-amber-700' :
                           'bg-red-500/10 text-red-400'
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums', color)}>
      {pct.toFixed(1).replace('.', ',')} %
    </span>
  )
}

// ── Combobox ingrédient avec suggestions ──────────────────────

function IngredientCombobox({
  products,
  value,
  onSelect,
  hasError,
  onProductCreated,
}: {
  products:         Product[]
  value:            string        // product_id sélectionné
  onSelect:         (id: string) => void
  hasError:         boolean
  onProductCreated: (p: Product) => void
}) {
  const [search,  setSearch]  = useState('')
  const [isOpen,  setIsOpen]  = useState(false)
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedProduct = products.find(p => p.id === value)

  // Fermer en cliquant ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        if (!selectedProduct) setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedProduct])

  // Afficher le nom du produit sélectionné dans l'input
  useEffect(() => {
    if (selectedProduct) setSearch(selectedProduct.name)
  }, [selectedProduct?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const term = search.trim().toLowerCase()

  // Produits existants correspondant à la recherche
  const matchingProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(term)).slice(0, 6),
    [products, term]
  )

  // Suggestions courantes non encore dans les produits
  const matchingSuggestions = useMemo(() =>
    COMMON_INGREDIENTS.filter(ing =>
      ing.name.toLowerCase().includes(term) &&
      !products.some(p => p.name.toLowerCase() === ing.name.toLowerCase())
    ).slice(0, 8),
    [products, term]
  )

  const hasResults = matchingProducts.length > 0 || matchingSuggestions.length > 0

  const handleSelectProduct = (product: Product) => {
    onSelect(product.id)
    setSearch(product.name)
    setIsOpen(false)
  }

  const handleSelectSuggestion = async (sug: IngredientSuggestion) => {
    setCreating(true)
    try {
      const res = await fetch('/api/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          sug.name,
          unit:          sug.unit,
          category:      sug.category,
          buy_price:     0,
          stock_qty:     0,
          min_threshold: 0,
        }),
      })
      const json = await res.json()
      if (json.product) {
        onProductCreated(json.product)
        onSelect(json.product.id)
        setSearch(json.product.name)
      }
    } catch { /* ignore */ } finally {
      setCreating(false)
      setIsOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Input recherche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          placeholder="Rechercher un ingrédient…"
          onFocus={() => { setIsOpen(true); if (selectedProduct) setSearch('') }}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); if (!e.target.value) onSelect('') }}
          className={cn(
            'w-full pl-8 pr-3 py-2 border rounded-lg text-sm transition-all outline-none',
            hasError
              ? 'border-red-400 bg-red-500/10 focus:ring-2 focus:ring-red-400/20'
              : selectedProduct
                ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-100'
                : 'border-white/10 focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
          )}
          disabled={creating}
        />
        {creating && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-spin" />
        )}
        {selectedProduct && !creating && (
          <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !creating && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {/* Produits existants */}
          {matchingProducts.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider bg-white/5 sticky top-0">
                Vos produits
              </div>
              {matchingProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelectProduct(p) }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#7798AB]/10 text-left gap-2"
                >
                  <span className="text-sm text-white font-medium truncate">{p.name}</span>
                  <span className="text-xs text-white/30 flex-shrink-0 tabular-nums">
                    {p.buy_price > 0 ? `${p.buy_price.toFixed(2)} €/${p.unit}` : p.unit}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Suggestions communes */}
          {matchingSuggestions.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider bg-white/5 sticky top-0">
                Suggestions
              </div>
              {matchingSuggestions.map(sug => (
                <button
                  key={sug.name}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(sug) }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-50 text-left gap-2 group"
                >
                  <span className="text-sm text-white/70 truncate">{sug.name}</span>
                  <span className="text-xs text-amber-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    + Ajouter au stock
                  </span>
                  <span className="text-xs text-white/30 flex-shrink-0">{sug.unit}</span>
                </button>
              ))}
            </>
          )}

          {!hasResults && term.length > 0 && (
            <div className="px-3 py-4 text-sm text-white/30 text-center">
              Aucun ingrédient trouvé pour « {search} »
            </div>
          )}

          {!hasResults && term.length === 0 && (
            <div className="px-3 py-3 text-xs text-white/30 text-center">
              Tapez pour rechercher parmi {products.length + COMMON_INGREDIENTS.length} ingrédients
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Formulaire d'ajout de recette ─────────────────────────────

function RecipeFormModal({
  products: initialProducts,
  recipe,
  onClose,
  onSaved,
}: {
  products: Product[]
  recipe?: RecipeWithFoodCost | null
  onClose: () => void
  onSaved: (r: RecipeWithFoodCost) => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  // Liste locale de produits — s'étend quand on crée un nouvel ingrédient
  const [localProducts, setLocalProducts] = useState<Product[]>(initialProducts)

  const handleProductCreated = useCallback((p: Product) => {
    setLocalProducts(prev => [...prev, p])
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id:         recipe?.id,
      dish_name:  recipe?.dish_name  ?? '',
      sell_price: recipe?.sell_price ?? undefined,
      category:   recipe?.category   ?? '',
      ingredients: recipe?.ingredients.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
      })) ?? [{ product_id: '', quantity: undefined as unknown as number }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  const watchedIngredients = watch('ingredients')
  const watchedSellPrice   = watch('sell_price') ?? 0

  // Calcul live du food cost
  const { ingredientCost, foodCostPct, marginEur, marginPct } = useMemo(() => {
    const ingredientCost = watchedIngredients.reduce((sum, ing) => {
      const product = localProducts.find(p => p.id === ing.product_id)
      if (!product || !ing.quantity) return sum
      return sum + product.buy_price * (ing.quantity ?? 0)
    }, 0)
    const sp = watchedSellPrice > 0 ? watchedSellPrice : 0
    const foodCostPct = sp > 0 ? (ingredientCost / sp) * 100 : 0
    const marginEur   = sp - ingredientCost
    const marginPct   = sp > 0 ? (marginEur / sp) * 100 : 0
    return { ingredientCost, foodCostPct, marginEur, marginPct }
  }, [watchedIngredients, watchedSellPrice, localProducts])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/recipes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setServerError(json.error ?? 'Erreur.'); return }
      onSaved(json.recipe)
    } catch {
      setServerError('Erreur réseau.')
    }
  }

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-white/70 border border-white/10 rounded-xl hover:bg-white/5"
      >Annuler</button>
      <button type="submit" form="recipe-form" disabled={isSubmitting}
        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {recipe ? 'Enregistrer' : 'Créer la fiche'}
      </button>
    </div>
  )

  return (
    <Modal
      title={recipe ? `Modifier — ${recipe.dish_name}` : 'Nouvelle fiche technique'}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={footer}
    >
      {serverError && (
        <div className="mb-4 flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {serverError}
        </div>
      )}

      {/* Résumé food cost live */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Vente',        value: `${watchedSellPrice.toFixed(2)} €`,  color: 'text-white' },
          { label: 'Coût ingréd.', value: `${ingredientCost.toFixed(2)} €`,    color: 'text-white/70' },
          { label: 'Food cost',    value: `${foodCostPct.toFixed(1)} %`,
            color: foodCostPct < 30 ? 'text-green-600' : foodCostPct < 40 ? 'text-amber-600' : 'text-red-600'
          },
          { label: 'Marge brute',  value: `${marginEur.toFixed(2)} € (${marginPct.toFixed(0)} %)`,
            color: marginEur >= 0 ? 'text-green-600' : 'text-red-600'
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">{stat.label}</p>
            <p className={cn('text-sm font-bold tabular-nums', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <form id="recipe-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Infos de base */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Nom du plat *
            </label>
            <input type="text" {...register('dish_name')} placeholder="Ex : Entrecôte frites"
              className={inputCls(!!errors.dish_name)} />
            {errors.dish_name && (
              <p className="mt-1 text-xs text-red-600">{errors.dish_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Prix de vente (€) *
            </label>
            <input type="number" step="0.01" min="0" {...register('sell_price', { valueAsNumber: true })}
              placeholder="0.00" className={cn(inputCls(!!errors.sell_price), 'w-28')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Catégorie
            </label>
            <input type="text" {...register('category')} placeholder="Entrée, Plat…"
              className={cn(inputCls(), 'w-32')} />
          </div>
        </div>

        {/* Ingrédients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Ingrédients
            </label>
            <button type="button"
              onClick={() => append({ product_id: '', quantity: 1 as unknown as number })}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>

          {errors.ingredients?.root && (
            <p className="mb-2 text-xs text-red-600">{errors.ingredients.root.message}</p>
          )}

          <div className="space-y-2">
            {fields.map((field, idx) => {
              const selectedProduct = localProducts.find(
                p => p.id === watchedIngredients[idx]?.product_id
              )
              const lineCost = selectedProduct && watchedIngredients[idx]?.quantity
                ? selectedProduct.buy_price * (watchedIngredients[idx]?.quantity ?? 0)
                : null

              return (
                <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                  {/* Combobox ingrédient */}
                  <IngredientCombobox
                    products={localProducts}
                    value={watchedIngredients[idx]?.product_id ?? ''}
                    onSelect={id => setValue(`ingredients.${idx}.product_id`, id, { shouldValidate: true })}
                    hasError={!!errors.ingredients?.[idx]?.product_id}
                    onProductCreated={handleProductCreated}
                  />

                  {/* Quantité — step 1 */}
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Qté"
                      {...register(`ingredients.${idx}.quantity`, { valueAsNumber: true })}
                      className={cn(inputCls(!!errors.ingredients?.[idx]?.quantity), 'w-24 pr-8')}
                    />
                    {selectedProduct && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">
                        {selectedProduct.unit}
                      </span>
                    )}
                  </div>

                  {/* Coût de la ligne */}
                  <span className="text-xs text-white/45 tabular-nums py-2 min-w-[52px] text-right">
                    {lineCost !== null && lineCost > 0 ? `${lineCost.toFixed(2)} €` : '—'}
                  </span>

                  {/* Supprimer */}
                  <button type="button" onClick={() => remove(idx)}
                    className="p-2 text-white/30 hover:text-red-500 transition-colors"
                    disabled={fields.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <p className="mt-2 text-[11px] text-white/30">
            Les ingrédients sélectionnés depuis les suggestions seront automatiquement ajoutés à votre stock (prix à 0 €, à mettre à jour).
          </p>
        </div>
      </form>
    </Modal>
  )
}

// ── Page fiches techniques ────────────────────────────────────

type RecipesPageProps = {
  products: Product[]
}

export function RecipesPage({ products }: RecipesPageProps) {
  const [recipes, setRecipes]         = useState<RecipeWithFoodCost[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editRecipe, setEditRecipe]   = useState<RecipeWithFoodCost | null>(null)

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true)
    try {
      const res  = await fetch('/api/recipes')
      const json = await res.json()
      setRecipes(json.recipes ?? [])
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const handleSaved = (r: RecipeWithFoodCost) => {
    setRecipes(prev => {
      const idx = prev.findIndex(x => x.id === r.id)
      return idx >= 0
        ? prev.map(x => x.id === r.id ? r : x)
        : [r, ...prev]
    })
    setShowForm(false)
    setEditRecipe(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Fiches techniques</h3>
          <p className="text-sm text-white/30 mt-0.5">
            Food cost calculé automatiquement selon les prix d'achat.
          </p>
        </div>
        <button
          onClick={() => { setEditRecipe(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ChefHat className="w-4 h-4" />
          Nouvelle fiche
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-white/30" />
          </div>
          <p className="text-sm text-white/45">Aucune fiche technique créée.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Créer la première fiche
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                {['Plat', 'Catégorie', 'Prix de vente', 'Coût ingrédients', 'Food cost', 'Marge brute', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/45 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipes.map(r => (
                <tr key={r.id} className="hover:bg-white/5 group">
                  <td className="px-4 py-3 font-medium text-white">{r.dish_name}</td>
                  <td className="px-4 py-3 text-white/45">{r.category ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">
                    {r.sell_price.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-white/45 tabular-nums">
                    {r.ingredient_cost.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    <FoodCostBadge pct={r.food_cost_pct} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-sm font-semibold tabular-nums',
                      r.margin_eur >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {r.margin_eur.toFixed(2)} €
                      <span className="font-normal text-xs ml-1 text-white/30">
                        ({r.margin_pct.toFixed(0)} %)
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditRecipe(r); setShowForm(true) }}
                      className="text-xs text-white/30 hover:text-[#7798AB] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <RecipeFormModal
          products={products}
          recipe={editRecipe}
          onClose={() => { setShowForm(false); setEditRecipe(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
