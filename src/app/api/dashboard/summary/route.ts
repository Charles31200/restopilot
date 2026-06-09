import { NextResponse } from 'next/server'
import { getDashboardSummary } from '@/lib/utils/dashboard-data'

/**
 * GET /api/dashboard/summary
 *
 * Retourne le résumé du tableau de bord pour le restaurant connecté.
 * Paramètre optionnel : ?period=day|week|month (ignoré pour l'instant,
 * le résumé inclut déjà les trois périodes dans une seule réponse).
 */
export async function GET() {
  try {
    const data = await getDashboardSummary()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[api/dashboard/summary]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données.' },
      { status: 500 }
    )
  }
}
