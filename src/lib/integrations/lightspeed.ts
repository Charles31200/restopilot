/**
 * lightspeed.ts — Connecteur Lightspeed Restaurant (anciennement Lightspeed K-Series).
 *
 * Authentification : OAuth 2.0 Authorization Code Flow.
 * Variables d'environnement requises :
 *   LIGHTSPEED_CLIENT_ID      — App ID dans le portail partenaires Lightspeed
 *   LIGHTSPEED_CLIENT_SECRET  — Secret correspondant
 *   NEXT_PUBLIC_APP_URL       — URL de base de l'app (ex: https://app.restopilot.fr)
 *
 * Flow :
 *   1. L'utilisateur clique "Connecter Lightspeed" → getLightspeedAuthUrl()
 *   2. Lightspeed redirige vers /api/auth/lightspeed/callback?code=...&state=...
 *   3. exchangeCodeForTokens() échange le code contre access_token + refresh_token
 *   4. Les tokens sont stockés chiffrés dans pos_integrations
 *   5. getLightspeedSales() appelle l'API avec un token valide (refresh auto)
 */

import type { POSSale, POSSaleItem } from './types'

// ── Config OAuth2 ─────────────────────────────────────────────

const LIGHTSPEED_TOKEN_URL = 'https://cloud.lightspeedhq.com/oauth/token'
const LIGHTSPEED_API_BASE  = 'https://api.lightspeedhq.com'

function getClientId()     { return process.env.LIGHTSPEED_CLIENT_ID     ?? '' }
function getClientSecret() { return process.env.LIGHTSPEED_CLIENT_SECRET ?? '' }
function getRedirectUri()  {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/auth/lightspeed/callback`
}

// ── Étape 2 : Échange du code ────────────────────────────────

export type LightspeedTokens = {
  access_token:  string
  refresh_token: string
  expires_in:    number   // secondes
}

export async function exchangeCodeForTokens(code: string): Promise<LightspeedTokens> {
  const res = await fetch(LIGHTSPEED_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     getClientId(),
      client_secret: getClientSecret(),
      redirect_uri:  getRedirectUri(),
      code,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Lightspeed token exchange échoué (${res.status}): ${err.slice(0, 200)}`)
  }

  const json = await res.json()
  return {
    access_token:  json.access_token,
    refresh_token: json.refresh_token,
    expires_in:    json.expires_in ?? 3600,
  }
}

// ── Refresh du token ──────────────────────────────────────────

async function refreshAccessToken(restaurantId: string, refreshToken: string): Promise<string> {
  const res = await fetch(LIGHTSPEED_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error(`Refresh token Lightspeed échoué (${res.status})`)

  const json = await res.json()
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString()

  // Persister le nouveau token
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase
    .from('pos_integrations')
    .update({
      access_token:     json.access_token,
      refresh_token:    json.refresh_token ?? refreshToken,
      token_expires_at: expiresAt,
      updated_at:       new Date().toISOString(),
    })
    .eq('restaurant_id', restaurantId)

  return json.access_token
}

// ── Récupération du token valide ──────────────────────────────

async function getValidToken(restaurantId: string): Promise<string> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pos_integrations')
    .select('access_token, refresh_token, token_expires_at')
    .eq('restaurant_id', restaurantId)
    .eq('pos_type', 'lightspeed')
    .single()

  if (error || !data?.access_token) throw new Error('Intégration Lightspeed non configurée')

  // Refresh si le token expire dans moins de 5 minutes
  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0
  if (expiresAt - Date.now() < 5 * 60 * 1000) {
    if (!data.refresh_token) throw new Error('Refresh token manquant — reconnectez Lightspeed')
    return refreshAccessToken(restaurantId, data.refresh_token)
  }

  return data.access_token
}

// ── Parsing des ventes Lightspeed ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLightspeedSale(raw: any): POSSale {
  const items: POSSaleItem[] = (raw.SaleLines?.SaleLine ?? []).map((l: any) => ({
    dish_name:     l.Item?.description ?? l.itemDescription ?? 'Inconnu',
    quantity_sold: Math.max(1, Number(l.unitQuantity) || 1),
    unit_price:    Number(l.unitPrice)   || 0,
  }))

  const total = Number(raw.calcTotal ?? raw.total) || 0

  return {
    date:          raw.timeStamp?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    total_revenue: total,
    covers:        Number(raw.guestCount) || 0,
    items,
    pos_reference: String(raw.saleID ?? raw.id ?? ''),
  }
}

// ── Fonction principale ───────────────────────────────────────

/**
 * Récupère toutes les ventes Lightspeed pour une date donnée.
 * Gère automatiquement le refresh de token si nécessaire.
 */
export async function getLightspeedSales(
  restaurantId: string,
  date: string    // YYYY-MM-DD
): Promise<POSSale[]> {
  const token = await getValidToken(restaurantId)

  // L'API Lightspeed attend une plage de dates au format ISO 8601
  const dateFrom = `${date}T00:00:00+00:00`
  const dateTo   = `${date}T23:59:59+00:00`

  const url = `${LIGHTSPEED_API_BASE}/API/2.0/Sale.json?` +
    new URLSearchParams({
      timeStamp:     `>,${dateFrom}`,
      timeStamp2:    `<,${dateTo}`,
      load_relations: JSON.stringify(['SaleLines', 'SaleLines.Item']),
      limit:         '100',
    })

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    throw new Error('Token Lightspeed invalide — reconnectez votre caisse')
  }
  if (!res.ok) {
    throw new Error(`Lightspeed API erreur ${res.status}`)
  }

  const json = await res.json()
  // L'API retourne { Sale: [...] } ou { Sale: {...} } pour un seul résultat
  const rawSales = Array.isArray(json.Sale) ? json.Sale
    : json.Sale ? [json.Sale]
    : []

  return rawSales.map(parseLightspeedSale)
}
