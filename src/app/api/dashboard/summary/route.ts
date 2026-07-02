import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/lib/utils/dashboard-data'

// Always execute fresh — never serve from Next.js Data Cache or CDN.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboardSummary()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[api/dashboard/summary]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données.' },
      { status: 500 }
    )
  }
}
