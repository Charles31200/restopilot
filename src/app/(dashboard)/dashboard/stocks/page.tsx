import type { Metadata } from 'next'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getStockStatus } from '@/app/api/products/route'
import { StocksClient }   from '@/components/stocks/StocksClient'
import { MobileHeader }   from '@/components/layout/MobileHeader'
import type { Product }   from '@/types'

export const metadata: Metadata = { title: 'Stocks — RestoPilot' }

export default async function StocksPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()

  let products: (Product & { status: 'ok' | 'low' | 'critical' })[] = []
  let categories: string[] = []

  if (profile?.restaurant_id) {
    const { data } = await supabase
      .from('products').select('*')
      .eq('restaurant_id', profile.restaurant_id).order('name')

    if (data) {
      products = data.map(p => ({ ...p, status: getStockStatus(p.stock_qty, p.min_threshold) }))
      categories = [...new Set(data.map(p => p.category).filter(Boolean) as string[])].sort()
    }
  }

  const criticalCount = products.filter(p => p.status === 'critical').length

  return (
    <>
      {/* ── Header mobile ───────────────────────────── */}
      <MobileHeader
        title="Stocks"
        variant="light"
        badgeCount={criticalCount}
      />

      {/* ── Titre desktop ───────────────────────────── */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Gestion des stocks
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--rp-navy-muted)' }}>
          Ingrédients · Livraisons · Inventaire · Fiches techniques
        </p>
      </div>

      {/* ── Module stocks (client component existant) ── */}
      <StocksClient
        initialProducts={products.slice(0, 20)}
        initialCategories={categories}
        initialTotal={products.length}
      />
    </>
  )
}
