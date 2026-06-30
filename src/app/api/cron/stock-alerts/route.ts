/**
 * GET /api/cron/stock-alerts
 * Vérifie les stocks de tous les restaurants actifs et envoie un
 * email d'alerte (Resend) aux propriétaires dont au moins un produit
 * est sous son seuil minimum. Limité à 1 email / 24h / restaurant.
 *
 * Sécurité : header Authorization: Bearer {CRON_SECRET}
 * Planification Vercel : 0 8 * * * (chaque jour à 8h00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkStockAlertsForAllRestaurants } from '@/lib/alerts/stock-alerts'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader  = request.headers.get('authorization')
  const token       = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await checkStockAlertsForAllRestaurants()

  const sent = results.filter(r => r.sent).length

  return NextResponse.json({
    total:   results.length,
    sent,
    skipped: results.length - sent,
    details: results,
  })
}
