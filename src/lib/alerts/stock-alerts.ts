/**
 * Alertes stocks par email.
 *
 * Pour un restaurant donné : repère les produits sous leur seuil
 * minimum (products.min_threshold) et envoie un email récapitulatif
 * au propriétaire via Resend. Limité à 1 email / 24h / restaurant
 * (restaurants.last_stock_alert_sent_at).
 *
 * Appelé par GET /api/cron/stock-alerts (voir vercel.json — cron
 * quotidien 8h).
 */

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { Database } from '@/types'

const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h

export type StockAlertResult =
  | { sent: true;  restaurantId: string; productCount: number }
  | { sent: false; restaurantId: string; reason: 'cooldown' | 'no_low_stock' | 'no_owner_email' | 'restaurant_not_found' | 'send_failed' }

type LowStockProduct = {
  name:          string
  stock_qty:     number
  min_threshold: number
  unit:          string
}

// ── Client admin (bypasse RLS) ──────────────────────────────────

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Template email ───────────────────────────────────────────────

function buildEmailHTML(restaurantName: string, products: LowStockProduct[]): string {
  const rows = products.map(p => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #F0F0F0;">${p.name}</td>
      <td style="padding:8px 12px;font-size:13px;color:#DC2626;font-weight:600;text-align:right;border-bottom:1px solid #F0F0F0;">${p.stock_qty} ${p.unit}</td>
      <td style="padding:8px 12px;font-size:13px;color:#888;text-align:right;border-bottom:1px solid #F0F0F0;">${p.min_threshold} ${p.unit}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Alerte stock</title></head>
<body style="font-family:Arial,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#111111;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;">⚠️ Stock bas</h1>
    <p style="margin:4px 0 0;opacity:.7;">${restaurantName}</p>
  </div>
  <div style="background:#fff;border:1px solid #E5E5E5;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <p style="font-size:14px;color:#333;">
      ${products.length} produit${products.length > 1 ? 's sont' : ' est'} sous le seuil minimum défini :
    </p>
    <table width="100%" style="border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr>
          <th style="padding:8px 12px;font-size:11px;color:#888;text-align:left;border-bottom:1px solid #E5E5E5;">Produit</th>
          <th style="padding:8px 12px;font-size:11px;color:#888;text-align:right;border-bottom:1px solid #E5E5E5;">Stock actuel</th>
          <th style="padding:8px 12px;font-size:11px;color:#888;text-align:right;border-bottom:1px solid #E5E5E5;">Seuil min</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:13px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stocks" style="color:#111111;font-weight:600;">
        Voir les stocks sur PilotResto →
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:16px 0;">
    <p style="font-size:11px;color:#9CA3AF;text-align:center;">PilotResto — alerte automatique de stock</p>
  </div>
</body>
</html>`
}

// ── Envoi via Resend (API REST, cohérent avec le reste du projet) ─

async function sendAlertEmail(toEmail: string, restaurantName: string, products: LowStockProduct[]): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'PilotResto Alertes <alertes@restopilot.pro>',
        to:      [toEmail],
        subject: `⚠️ ${products.length} produit${products.length > 1 ? 's' : ''} sous le seuil de stock — ${restaurantName}`,
        html:    buildEmailHTML(restaurantName, products),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Vérification + envoi pour un restaurant ─────────────────────

export async function checkStockAlertsForRestaurant(restaurantId: string): Promise<StockAlertResult> {
  const supabase = getAdminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, last_stock_alert_sent_at')
    .eq('id', restaurantId)
    .single()

  if (!restaurant) {
    return { sent: false, restaurantId, reason: 'restaurant_not_found' }
  }

  // Cooldown 24h
  if (restaurant.last_stock_alert_sent_at) {
    const elapsed = Date.now() - new Date(restaurant.last_stock_alert_sent_at).getTime()
    if (elapsed < ALERT_COOLDOWN_MS) {
      return { sent: false, restaurantId, reason: 'cooldown' }
    }
  }

  // Produits sous le seuil (seuil > 0 = surveillance activée pour ce produit)
  const { data: products } = await supabase
    .from('products')
    .select('name, stock_qty, min_threshold, unit')
    .eq('restaurant_id', restaurantId)
    .gt('min_threshold', 0)

  const lowStock = (products ?? []).filter(p => p.stock_qty < p.min_threshold)

  if (lowStock.length === 0) {
    return { sent: false, restaurantId, reason: 'no_low_stock' }
  }

  // Email du propriétaire (auth.users via Supabase Admin API)
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('role', 'owner')
    .limit(1)
    .single()

  let ownerEmail: string | null = null
  if (ownerProfile) {
    const { data: userData } = await supabase.auth.admin.getUserById(ownerProfile.id)
    ownerEmail = userData?.user?.email ?? null
  }

  if (!ownerEmail) {
    return { sent: false, restaurantId, reason: 'no_owner_email' }
  }

  const emailSent = await sendAlertEmail(ownerEmail, restaurant.name, lowStock)
  if (!emailSent) {
    return { sent: false, restaurantId, reason: 'send_failed' }
  }

  // Marque l'envoi pour respecter le cooldown 24h
  await supabase
    .from('restaurants')
    .update({ last_stock_alert_sent_at: new Date().toISOString() })
    .eq('id', restaurantId)

  return { sent: true, restaurantId, productCount: lowStock.length }
}

// ── Vérification pour tous les restaurants actifs ────────────────
// "Actif" = abonnement en statut active ou trialing.

export async function checkStockAlertsForAllRestaurants(): Promise<StockAlertResult[]> {
  const supabase = getAdminClient()

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('restaurant_id')
    .in('status', ['active', 'trialing'])

  const restaurantIds = [...new Set((subs ?? []).map(s => s.restaurant_id))]
  if (restaurantIds.length === 0) return []

  const results: StockAlertResult[] = []
  for (const id of restaurantIds) {
    results.push(await checkStockAlertsForRestaurant(id))
  }
  return results
}
