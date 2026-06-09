import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Types ─────────────────────────────────────────────────────

export type RecipeIngredientWithProduct = {
  id: string
  recipe_id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    buy_price: number
    unit: string
  }
}

export type RecipeWithFoodCost = {
  id: string
  restaurant_id: string
  dish_name: string
  sell_price: number
  category: string | null
  is_active: boolean
  created_at: string
  ingredients: RecipeIngredientWithProduct[]
  /** Coût total des ingrédients (€) */
  ingredient_cost: number
  /** Food cost % = ingredient_cost / sell_price × 100 */
  food_cost_pct: number
  /** Marge brute € = sell_price - ingredient_cost */
  margin_eur: number
  /** Marge brute % */
  margin_pct: number
}

// ── Calcul food cost ──────────────────────────────────────────

function calcFoodCost(
  sellPrice: number,
  ingredients: { quantity: number; product: { buy_price: number } }[]
): { ingredient_cost: number; food_cost_pct: number; margin_eur: number; margin_pct: number } {
  const ingredient_cost = ingredients.reduce(
    (sum, ing) => sum + ing.quantity * ing.product.buy_price, 0
  )
  const food_cost_pct = sellPrice > 0 ? (ingredient_cost / sellPrice) * 100 : 0
  const margin_eur    = sellPrice - ingredient_cost
  const margin_pct    = sellPrice > 0 ? (margin_eur / sellPrice) * 100 : 0
  return {
    ingredient_cost: +ingredient_cost.toFixed(4),
    food_cost_pct:   +food_cost_pct.toFixed(2),
    margin_eur:      +margin_eur.toFixed(4),
    margin_pct:      +margin_pct.toFixed(2),
  }
}

// ── Schéma de validation ──────────────────────────────────────

const ingredientSchema = z.object({
  product_id: z.string().uuid(),
  quantity:   z.coerce.number().positive('Quantité positive requise'),
})

const recipeSchema = z.object({
  id:          z.string().uuid().optional(),
  dish_name:   z.string().min(2, 'Nom requis'),
  sell_price:  z.coerce.number().positive('Prix de vente requis'),
  category:    z.string().nullable().optional(),
  is_active:   z.boolean().optional().default(true),
  ingredients: z.array(ingredientSchema).min(1, 'Au moins un ingrédient requis'),
})

// ── GET /api/recipes ──────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  if (!profile?.restaurant_id) return NextResponse.json({ recipes: [] })

  // cast nécessaire : notre Database type ne déclare pas la FK
  // recipes→recipe_ingredients, Supabase génère un SelectQueryError sinon.
  const { data: rawRecipes, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients(
        id,
        recipe_id,
        product_id,
        quantity,
        product:products(id, name, buy_price, unit)
      )
    `)
    .eq('restaurant_id', profile.restaurant_id)
    .order('dish_name') as unknown as {
      data: Array<{
        id: string; restaurant_id: string; dish_name: string
        sell_price: number; category: string | null
        is_active: boolean; created_at: string
        recipe_ingredients: RecipeIngredientWithProduct[]
      }> | null
      error: { message: string } | null
    }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched: RecipeWithFoodCost[] = (rawRecipes ?? []).map(r => {
    const ingredients = r.recipe_ingredients ?? []
    const costs = calcFoodCost(r.sell_price, ingredients)
    return { ...r, ingredients, ...costs }
  })

  return NextResponse.json({ recipes: enriched })
}

// ── POST /api/recipes (créer ou modifier + ingrédients) ───────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = recipeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  // Renommé bodyIngredients pour éviter le conflit avec la variable plus bas
  const { id, ingredients: bodyIngredients, ...recipeData } = parsed.data

  let recipeId: string

  if (id) {
    // Mise à jour de la recette
    const { error } = await supabase
      .from('recipes')
      .update(recipeData)
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    recipeId = id

    // Supprimer les anciens ingrédients
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
  } else {
    // Création
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({ ...recipeData, restaurant_id: profile.restaurant_id })
      .select()
      .single()

    if (error || !recipe) {
      return NextResponse.json({ error: error?.message ?? 'Erreur création' }, { status: 500 })
    }
    recipeId = recipe.id
  }

  // Insérer les ingrédients
  const { error: ingError } = await supabase
    .from('recipe_ingredients')
    .insert(
      bodyIngredients.map(ing => ({
        recipe_id:  recipeId,
        product_id: ing.product_id,
        quantity:   ing.quantity,
      }))
    )

  if (ingError) {
    return NextResponse.json({ error: ingError.message }, { status: 500 })
  }

  // Retourner la recette complète avec food cost
  const { data: rawFull } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients(
        id, recipe_id, product_id, quantity,
        product:products(id, name, buy_price, unit)
      )
    `)
    .eq('id', recipeId)
    .single() as unknown as {
      data: {
        id: string; restaurant_id: string; dish_name: string
        sell_price: number; category: string | null
        is_active: boolean; created_at: string
        recipe_ingredients: RecipeIngredientWithProduct[]
      } | null
      error: { message: string } | null
    }

  if (!rawFull) return NextResponse.json({ error: 'Recette introuvable' }, { status: 500 })

  const ingredients = rawFull.recipe_ingredients ?? []
  const enriched: RecipeWithFoodCost = {
    ...rawFull,
    ingredients,
    ...calcFoodCost(rawFull.sell_price, ingredients),
  }

  return NextResponse.json({ recipe: enriched }, { status: id ? 200 : 201 })
}
