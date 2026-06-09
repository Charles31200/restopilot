/**
 * GET /api/cron/sync
 * Synchronisation automatique quotidienne de toutes les caisses connectées.
 *
 * Sécurité : header Authorization: Bearer {CRON_SECRET}
 * Planification Vercel : 0 2 * * * (chaque nuit à 2h00 UTC)
 *
 * Logique :
 *  1. Vérifier le CRON_SECRET
 *  2. Lister tous les pos_integrations actifs
 *  3. Pour chaque restaurant, lancer syncRestaurant() avec la date d'hier
 *  4. Si une sync échoue, envoyer un email d'alerte via Resend
 *  5. Retourner le rapport global { total, success, failed, details[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { syncRestaurant } from '@/lib/integrations/sync-engine'
import type { Database } from '@/types'

// ── Client admin (bypasse RLS pour lire tous les restaurants) ─

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Envoi d'alerte email ──────────────────────────────────────

async function sendErrorAlert(
  ownerEmail: string,
  restaurantName: string,
  errors: string[]
) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || !ownerEmail) return

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'RestoPilot Alertes <alertes@restopilot.fr>',
      to:      [ownerEmail],
      subject: `⚠️ Sync automatique échouée — ${restaurantName}`,
      html: `
        <p>Bonjour,</p>
        <p>La synchronisation automatique des ventes de <strong>${restaurantName}</strong>
           a rencontré des erreurs cette nuit.</p>
        <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
        <p>Connectez-vous à <a href="${process.env.NEXT_PUBLIC_APP_URL}">RestoPilot</a>
           pour synchroniser manuellement ou vérifier la connexion de votre caisse.</p>
        <p style="font-size:11px;color:#9CA3AF;">RestoPilot — sync automatique</p>
      `,
    }),
  }).catch(() => { /* silencieux si Resend indisponible */ })
}

// ── Route Handler ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Vérifier le secret Cron
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const token      = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()

  // 2. Récupérer tous les restaurants avec une intégration active
  const { data: integrations, error: listError } = await admin
    .from('pos_integrations')
    .select('restaurant_id, pos_type')
    .eq('is_active', true)
    .neq('pos_type', 'csv')   // CSV = import manuel uniquement

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  if (!integrations?.length) {
    return NextResponse.json({ total: 0, success: 0, failed: 0, details: [] })
  }

  // 3. Récupérer les infos des restaurants pour les alertes email
  const restaurantIds = integrations.map(i => i.restaurant_id)

  const { data: restaurants } = await admin
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds)

  const { data: profiles } = await admin
    .from('profiles')
    .select('restaurant_id, id')
    .in('restaurant_id', restaurantIds)
    .eq('role', 'owner')

  // Récupérer les emails des owners via auth admin
  const ownerEmails = new Map<string, string>()
  for (const profile of profiles ?? []) {
    try {
      const { data: userData } = await admin.auth.admin.getUserById(profile.id)
      if (userData?.user?.email && profile.restaurant_id) {
        ownerEmails.set(profile.restaurant_id, userData.user.email)
      }
    } catch { /* continuer */ }
  }

  // 4. Synchroniser la date d'hier (les caisses ferment après minuit)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  const details: Array<{
    restaurant_id: string
    pos_type:      string
    success:       boolean
    salesCreated:  number
    errors:        string[]
  }> = []

  let successCount = 0
  let failedCount  = 0

  for (const integration of integrations) {
    const result = await syncRestaurant(integration.restaurant_id, [dateStr])

    details.push({
      restaurant_id: integration.restaurant_id,
      pos_type:      integration.pos_type,
      success:       result.success,
      salesCreated:  result.salesCreated,
      errors:        result.errors,
    })

    if (result.success) {
      successCount++
    } else {
      failedCount++
      // Envoyer une alerte email si des erreurs sont survenues
      const ownerEmail = ownerEmails.get(integration.restaurant_id)
      const restaurant = restaurants?.find(r => r.id === integration.restaurant_id)
      if (ownerEmail && restaurant && result.errors.length > 0) {
        await sendErrorAlert(ownerEmail, restaurant.name, result.errors)
      }
    }
  }

  return NextResponse.json({
    total:   integrations.length,
    success: successCount,
    failed:  failedCount,
    date:    dateStr,
    details,
  })
}
