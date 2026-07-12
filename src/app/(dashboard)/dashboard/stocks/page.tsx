import type { Metadata } from 'next'
import { createClient }   from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getStockStatus } from '@/app/api/products/route'
import { StocksClient }   from '@/components/stocks/StocksClient'
import type { Product }   from '@/types'

export const metadata: Metadata = { title: 'Stocks — PilotResto' }

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
      {/* ── Header de page ──────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            Stocks
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            Ingrédients · Livraisons · Inventaire · Fiches techniques
          </p>
        </div>
        {criticalCount > 0 && (
          <span className="mt-1 rp-tag" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
            {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
          </span>
        )}
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
