'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  PlusCircle, Trash2, ChefHat, Loader2, AlertCircle,
  Euro, TrendingDown, Package, X,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types'
import type { RecipeWithFoodCost } from '@/app/api/recipes/route'

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
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  )

function FoodCostBadge({ pct }: { pct: number }) {
  const color = pct < 30 ? 'bg-green-50 text-green-700' :
                pct < 40 ? 'bg-amber-50 text-amber-700' :
                           'bg-red-50 text-red-700'
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums', color)}>
      {pct.toFixed(1).replace('.', ',')} %
    </span>
  )
}

// ── Formulaire d'ajout de recette ─────────────────────────────

function RecipeFormModal({
  products,
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

  const {
    register,
    handleSubmit,
    watch,
    control,
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

  // ── Calcul live du food cost ──────────────────────────────
  const { ingredientCost, foodCostPct, marginEur, marginPct } = useMemo(() => {
    const ingredientCost = watchedIngredients.reduce((sum, ing) => {
      const product = products.find(p => p.id === ing.product_id)
      if (!product || !ing.quantity) return sum
      return sum + product.buy_price * (ing.quantity ?? 0)
    }, 0)
    const sp = watchedSellPrice > 0 ? watchedSellPrice : 0
    const foodCostPct = sp > 0 ? (ingredientCost / sp) * 100 : 0
    const marginEur   = sp - ingredientCost
    const marginPct   = sp > 0 ? (marginEur / sp) * 100 : 0
    return { ingredientCost, foodCostPct, marginEur, marginPct }
  }, [watchedIngredients, watchedSellPrice, products])

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
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
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
        <div className="mb-4 flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {serverError}
        </div>
      )}

      {/* Résumé food cost live */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { label: 'Vente',        value: `${watchedSellPrice.toFixed(2)} €`,  color: 'text-gray-900' },
          { label: 'Coût ingréd.', value: `${ingredientCost.toFixed(2)} €`,    color: 'text-gray-700' },
          { label: 'Food cost',    value: `${foodCostPct.toFixed(1)} %`,
            color: foodCostPct < 30 ? 'text-green-600' : foodCostPct < 40 ? 'text-amber-600' : 'text-red-600'
          },
          { label: 'Marge brute',  value: `${marginEur.toFixed(2)} € (${marginPct.toFixed(0)} %)`,
            color: marginEur >= 0 ? 'text-green-600' : 'text-red-600'
          },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{stat.label}</p>
            <p className={cn('text-sm font-bold tabular-nums', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <form id="recipe-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Infos de base */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nom du plat *
            </label>
            <input type="text" {...register('dish_name')} placeholder="Ex : Entrecôte frites"
              className={inputCls(!!errors.dish_name)} />
            {errors.dish_name && (
              <p className="mt-1 text-xs text-red-600">{errors.dish_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prix de vente (€) *
            </label>
            <input type="number" step="0.01" min="0" {...register('sell_price', { valueAsNumber: true })}
              placeholder="0.00" className={cn(inputCls(!!errors.sell_price), 'w-28')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input type="text" {...register('category')} placeholder="Entrée, Plat…"
              className={cn(inputCls(), 'w-32')} />
          </div>
        </div>

        {/* Ingrédients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Ingrédients
            </label>
            <button type="button"
              onClick={() => append({ product_id: '', quantity: 0 as unknown as number })}
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
              const selectedProduct = products.find(
                p => p.id === watchedIngredients[idx]?.product_id
              )
              const lineCost = selectedProduct && watchedIngredients[idx]?.quantity
                ? selectedProduct.buy_price * (watchedIngredients[idx]?.quantity ?? 0)
                : null

              return (
                <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                  {/* Sélecteur produit */}
                  <div>
                    <select {...register(`ingredients.${idx}.product_id`)}
                      className={inputCls(!!errors.ingredients?.[idx]?.product_id)}>
                      <option value="">— Produit —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit}) — {p.buy_price.toFixed(2)} €/{p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantité */}
                  <div className="relative">
                    <input
                      type="number" step="0.001" min="0"
                      placeholder="Qté"
                      {...register(`ingredients.${idx}.quantity`, { valueAsNumber: true })}
                      className={cn(inputCls(!!errors.ingredients?.[idx]?.quantity), 'w-24 pr-8')}
                    />
                    {selectedProduct && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                        {selectedProduct.unit}
                      </span>
                    )}
                  </div>

                  {/* Coût de la ligne */}
                  <span className="text-xs text-gray-500 tabular-nums py-2 min-w-[52px] text-right">
                    {lineCost !== null ? `${lineCost.toFixed(2)} €` : '—'}
                  </span>

                  {/* Supprimer */}
                  <button type="button" onClick={() => remove(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={fields.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
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
          <h3 className="text-base font-semibold text-gray-900">Fiches techniques</h3>
          <p className="text-sm text-gray-400 mt-0.5">
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
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Aucune fiche technique créée.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Créer la première fiche
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Plat', 'Catégorie', 'Prix de vente', 'Coût ingrédients', 'Food cost', 'Marge brute', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipes.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.dish_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.category ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">
                    {r.sell_price.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">
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
                      <span className="font-normal text-xs ml-1 text-gray-400">
                        ({r.margin_pct.toFixed(0)} %)
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditRecipe(r); setShowForm(true) }}
                      className="text-xs text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
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
