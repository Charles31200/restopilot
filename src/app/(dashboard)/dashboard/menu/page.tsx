import type { Metadata } from 'next'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { MenuClient }     from '@/components/menu/MenuClient'
import { MobileHeader }   from '@/components/layout/MobileHeader'

export const metadata: Metadata = { title: 'Menu & Recettes — RestoPilot' }

export default async function MenuPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  let initialItems: unknown[] = []
  let products: unknown[] = []

  if (profile?.restaurant_id) {
    const [{ data: items }, { data: prods }] = await Promise.all([
      supabase
        .from('menu_items')
        .select(`*, menu_item_ingredients ( id, quantity, products ( id, name, unit ) )`)
        .eq('restaurant_id', profile.restaurant_id)
        .order('category').order('name'),
      supabase
        .from('products')
        .select('id, name, unit, stock_qty')
        .eq('restaurant_id', profile.restaurant_id)
        .order('name'),
    ])
    initialItems = items ?? []
    products = prods ?? []
  }

  return (
    <div className="flex flex-col h-full">
      <MobileHeader title="Menu & Recettes" />
      <MenuClient
        initialItems={initialItems as Parameters<typeof MenuClient>[0]['initialItems']}
        products={products as Parameters<typeof MenuClient>[0]['products']}
      />
    </div>
  )
}
