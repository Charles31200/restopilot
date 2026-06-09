/**
 * destock.ts — Déstockage automatique des ingrédients lors d'une vente.
 *
 * Fonctionnement :
 *  1. Pour chaque plat vendu, on cherche la recette correspondante.
 *  2. Pour chaque ingrédient de la recette, on calcule la quantité à retirer.
 *  3. On met à jour stock_qty dans `products`.
 *  4. On crée un `stock_movement` de type 'sale'.
 *  5. On retourne la liste des produits passés sous leur seuil minimum.
 *
 * Cette fonction utilise le client Supabase SERVER (cookies de l'utilisateur).
 * Elle peut être appelée depuis une Server Action ou un Route Handler authentifié.
 */

import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────

export type SaleItemInput = {
  dish_name:     string
  quantity_sold: number
  sale_id?:      string   // pour le champ `note` du mouvement
}

export type DestockResult = {
  processed: number                     // nb de recettes trouvées et traitées
  skipped:   string[]                   // plats sans recette active
  critical:  Array<{                    // produits passés sous seuil min
    product_id:   string
    product_name: string
    unit:         string
    new_qty:      number
    threshold:    number
  }>
  errors:    string[]
}

// ── Fonction principale ───────────────────────────────────────

export async function processDestock(
  restaurantId: string,
  saleItems: SaleItemInput[]
): Promise<DestockResult> {
  const supabase = await createClient()
  const result: DestockResult = { processed: 0, skipped: [], critical: [], errors: [] }

  for (const item of saleItems) {
    // 1. Trouver la recette active par nom de plat
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .select(`
        id,
        dish_name,
        recipe_ingredients(
          quantity,
          product_id
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('dish_name', item.dish_name)
      .eq('is_active', true)
      .single()

    if (recipeErr || !recipe) {
      result.skipped.push(item.dish_name)
      continue
    }

    // cast : notre Database type ne déclare pas la FK recipes→recipe_ingredients
    const ingredients = (recipe.recipe_ingredients as unknown as Array<{
      quantity: number
      product_id: string
    }>) ?? []
    if (ingredients.length === 0) {
      result.skipped.push(`${item.dish_name} (aucun ingrédient)`)
      continue
    }

    // 2. Pour chaque ingrédient, retirer la quantité consommée
    for (const ing of ingredients) {
      const consumed = ing.quantity * item.quantity_sold

      // Lire le stock actuel
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('id, name, stock_qty, min_threshold, unit')
        .eq('id', ing.product_id)
        .single()

      if (pErr || !product) {
        result.errors.push(`Produit ${ing.product_id} introuvable`)
        continue
      }

      const prevQty = product.stock_qty
      const newQty  = Math.max(0, prevQty - consumed)

      // 3. Mise à jour du stock
      const { error: updErr } = await supabase
        .from('products')
        .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
        .eq('id', product.id)

      if (updErr) {
        result.errors.push(`Mise à jour stock ${product.name} : ${updErr.message}`)
        continue
      }

      // 4. Créer le mouvement de stock de type 'sale'
      await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        product_id:    product.id,
        type:          'sale',
        quantity:      -consumed,   // valeur négative = sortie
        note:          item.sale_id
          ? `Vente #${item.sale_id} — ${item.dish_name} × ${item.quantity_sold}`
          : `Vente — ${item.dish_name} × ${item.quantity_sold}`,
      })

      // 5. Vérifier si le stock est passé sous le seuil minimum
      const threshold = product.min_threshold
      const wentCritical =
        threshold > 0 && prevQty >= threshold && newQty < threshold

      if (wentCritical) {
        result.critical.push({
          product_id:   product.id,
          product_name: product.name,
          unit:         product.unit,
          new_qty:      newQty,
          threshold,
        })
      }
    }

    result.processed++
  }

  return result
}

// ── Déstockage depuis un objet vente complet ──────────────────

/**
 * Variante : appelle processDestock depuis un sale_id.
 * Récupère les sale_items liés, puis déstocke.
 */
export async function destockFromSale(
  restaurantId: string,
  saleId: string
): Promise<DestockResult> {
  const supabase = await createClient()

  const { data: saleItems, error } = await supabase
    .from('sale_items')
    .select('dish_name, quantity_sold')
    .eq('sale_id', saleId)

  if (error || !saleItems?.length) {
    return { processed: 0, skipped: [], critical: [], errors: [error?.message ?? 'Vente vide'] }
  }

  return processDestock(
    restaurantId,
    saleItems.map(s => ({ ...s, sale_id: saleId }))
  )
}
