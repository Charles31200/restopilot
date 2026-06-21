import type { Metadata } from 'next'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { MenuClient }     from '@/components/menu/MenuClient'
import { MobileHeader }   from '@/components/layout/MobileHeader'
import type { MenuRecipe, MenuProduct } from '@/components/menu/MenuClient'

export const metadata: Metadata = { title: 'Menu & Recettes — RestoPilot' }

export default async function MenuPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  let initialItems: MenuRecipe[] = []
  let products: MenuProduct[]    = []

  if (profile?.restaurant_id) {
    const [recipesResult, prodsResult] = await Promise.all([
      supabase
        .from('recipes')
        .select('id, dish_name, category, sell_price, is_active, created_at, recipe_ingredients(id, quantity, product_id)')
        .eq('restaurant_id', profile.restaurant_id)
        .order('category').order('dish_name') as unknown as Promise<{
          data: Array<{
            id: string; dish_name: string; category: string | null
            sell_price: number; is_active: boolean; created_at: string
            recipe_ingredients: Array<{ id: string; quantity: number; product_id: string }>
          }> | null
        }>,
      supabase
        .from('products')
        .select('id, name, unit, stock_qty')
        .eq('restaurant_id', profile.restaurant_id)
        .order('name'),
    ])

    initialItems = (recipesResult.data ?? []).map(r => ({
      ...r,
      recipe_ingredients: (r.recipe_ingredients ?? []).map(i => ({
        id:       i.id,
        quantity: i.quantity,
        products: null,
      })),
    }))

    products = (prodsResult.data ?? []) as MenuProduct[]
  }

  return (
    <div className="flex flex-col h-full">
      <MobileHeader title="Menu & Recettes" />
      <MenuClient initialItems={initialItems} products={products} />
    </div>
  )
}
