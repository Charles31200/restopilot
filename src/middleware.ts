// ─────────────────────────────────────────────────────────────
// middleware.ts — exécuté par Next.js à chaque requête (edge)
//
// Règles d'accès :
//  0. Routes marketing publiques → accès libre (pas de Supabase)
//  1. Homepage /                 → /login ou /dashboard
//  2. Non connecté + route protégée → /login
//  3. Connecté sur page auth     → /dashboard
//  4. Pas de cookie pwa_installed → /install
//  5. Onboarding incomplet       → /onboarding
//  6. Pas d'abonnement actif     → /onboarding-payment
//  7. active | trialing          → accès autorisé
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes 100 % publiques — pas de Supabase, pas de cookie PWA
// NB : /login et /register sont intentionnellement absents ici pour que
// le middleware puisse rediriger les utilisateurs déjà connectés vers
// /dashboard (règle 3 ci-dessous). Les rendre FULLY_PUBLIC ferait
// court-circuiter cette vérification → flash de la page de connexion.
const FULLY_PUBLIC = [
  '/',
  '/landing',
  '/install',
  '/contact',
  '/pricing',
  '/cgu-cgv',
  '/politique-de-confidentialite',
  '/auth',
  '/downloads',
]

// Routes dashboard accessibles sans abonnement actif (évite les boucles)
const SUBSCRIPTION_EXEMPT = [
  '/dashboard/parametres/abonnement',
  '/dashboard/compte',
  '/dashboard/upgrade',
  '/onboarding-payment',
  '/add-card',
]

// ── Cache cookie des vérifications dashboard (profil + abonnement) ──
//
// Évite de refaire l'aller-retour Supabase (profiles + subscriptions)
// à chaque navigation entre pages du dashboard. Le cookie est signé
// (HMAC-SHA256) avec SUPABASE_SERVICE_ROLE_KEY pour empêcher un
// utilisateur de forger un statut "active" côté client — un cookie
// invalide ou expiré déclenche une relecture fraîche depuis Supabase.

const CACHE_COOKIE  = 'rp_dash_cache'
const CACHE_TTL_MS  = 60_000

type DashboardCache = {
  uid:              string
  firstName:        string | null
  restaurantId:     string | null
  subStatus:        string | null
  hasPaymentMethod: boolean | null
  exp:              number
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str: string): string {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function sign(payload: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return toHex(sig)
}

async function readDashboardCache(request: NextRequest, uid: string): Promise<DashboardCache | null> {
  const raw = request.cookies.get(CACHE_COOKIE)?.value
  if (!raw) return null
  const [payloadB64, sig] = raw.split('.')
  if (!payloadB64 || !sig) return null

  try {
    const expectedSig = await sign(payloadB64)
    if (expectedSig !== sig) return null // cookie altéré → on ignore

    const cache = JSON.parse(b64urlDecode(payloadB64)) as DashboardCache
    if (cache.uid !== uid) return null      // cache d'un autre utilisateur
    if (Date.now() > cache.exp) return null // expiré (TTL 60s)

    return cache
  } catch {
    return null
  }
}

async function writeDashboardCache(response: NextResponse, data: Omit<DashboardCache, 'exp'>) {
  const cache: DashboardCache = { ...data, exp: Date.now() + CACHE_TTL_MS }
  const payloadB64 = b64urlEncode(JSON.stringify(cache))
  const sig = await sign(payloadB64)
  response.cookies.set(CACHE_COOKIE, `${payloadB64}.${sig}`, {
    httpOnly:  true,
    secure:    true,
    sameSite:  'lax',
    maxAge:    CACHE_TTL_MS / 1000,
    path:      '/',
  })
}

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const { pathname } = request.nextUrl

  // ── 0. Routes publiques → court-circuit immédiat ─────────────
  const userAgentEarly = request.headers.get('user-agent') ?? ''
  const isElectronEarly = userAgentEarly.includes('Electron')

  // Dans l'app Electron, / et /landing redirigent vers /login
  if (isElectronEarly && (pathname === '/' || pathname === '/landing')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (FULLY_PUBLIC.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return response
  }

  // ── Client Supabase edge ──────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() peut lever (cookie de session corrompu/périmé après un
  // signOut partiel, hoquet réseau vers Supabase Auth…). Avant que /login
  // et /register ne sortent de FULLY_PUBLIC, ce chemin n'était jamais
  // exécuté pour ces routes ; une exception ici plantait désormais le
  // middleware et rendait la connexion/inscription totalement impossibles.
  // Fail-open : une erreur = utilisateur non authentifié, jamais un crash.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  const isAuthRoute         = pathname === '/login' || pathname === '/register'
  const isDashboardRoute    = pathname.startsWith('/dashboard')
  const isOnboarding        = pathname === '/onboarding'
  const isOnboardingPayment = pathname === '/onboarding-payment'
  const isAddCard           = pathname === '/add-card'
  const needsAuth           = isDashboardRoute || isOnboarding || isOnboardingPayment || isAddCard

  // ── 1. Homepage ───────────────────────────────────────────────
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
  }

  // ── 2. Non connecté → protéger les routes protégées ──────────
  if (!user && needsAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Pas connecté, route non protégée (ex: /login, /register) → continue
  if (!user) return response

  // ── 3. Connecté sur page auth → /dashboard ───────────────────
  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 4. Check cookie PWA (dashboard + onboarding + onboarding-payment) ─
  const needsPWA = isDashboardRoute || isOnboarding || isOnboardingPayment
  if (needsPWA) {
    const userAgent  = request.headers.get('user-agent') ?? ''
    const isElectron = userAgent.includes('Electron')
    const isPWA      = isElectron || request.cookies.get('pwa_installed')?.value === 'true'
    if (!isPWA) {
      return NextResponse.redirect(new URL('/install', request.url))
    }
  }

  // ── 5-6. Vérifications dashboard (profil + abonnement) ────────
  if (isDashboardRoute) {
    const isExempt = SUBSCRIPTION_EXEMPT.some(p => pathname.startsWith(p))

    // Cache valide (≤ 60s, signé, même utilisateur) → on saute Supabase
    const cached = await readDashboardCache(request, user.id)

    let firstName:        string | null
    let restaurantId:     string | null
    let subStatus:        string | null
    let hasPaymentMethod: boolean | null

    if (cached) {
      firstName        = cached.firstName
      restaurantId     = cached.restaurantId
      subStatus        = cached.subStatus
      hasPaymentMethod = cached.hasPaymentMethod
    } else {
      try {
        // Une seule requête : profile + restaurant + abonnement imbriqués
        // (jointure PostgREST via les FK profiles.restaurant_id → restaurants.id
        // et subscriptions.restaurant_id → restaurants.id), au lieu de deux
        // allers-retours séquentiels.
        const { data: profile } = await supabase
          .from('profiles')
          .select('restaurant_id, first_name, restaurants(subscriptions(status, has_payment_method))')
          .eq('id', user.id)
          .single()

        type EmbeddedRestaurant = {
          subscriptions?: { status: string; has_payment_method: boolean }[]
        } | null

        const restaurant = (profile?.restaurants ?? null) as unknown as EmbeddedRestaurant
        const sub = restaurant?.subscriptions?.[0] ?? null

        firstName        = profile?.first_name    ?? null
        restaurantId      = profile?.restaurant_id ?? null
        subStatus         = sub?.status            ?? null
        hasPaymentMethod  = sub?.has_payment_method ?? null

        await writeDashboardCache(response, { uid: user.id, firstName, restaurantId, subStatus, hasPaymentMethod })
      } catch {
        // Fail-open : ne pas bloquer des utilisateurs valides en cas d'erreur DB
        return response
      }
    }

    // 5. Onboarding incomplet → /onboarding
    if (!firstName) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // 6. Vérifier l'abonnement (sauf routes exemptées)
    if (!isExempt) {
      if (!restaurantId) {
        return NextResponse.redirect(new URL('/onboarding-payment', request.url))
      }

      // active | trialing → OK ; tout le reste → onboarding-payment
      const isActive = subStatus === 'active' || subStatus === 'trialing'

      if (!isActive) {
        const url = new URL('/onboarding-payment', request.url)
        url.searchParams.set('reason', 'subscription_required')
        return NextResponse.redirect(url)
      }

      // Trialing sans carte bancaire → /add-card
      if (subStatus === 'trialing' && hasPaymentMethod === false) {
        return NextResponse.redirect(new URL('/add-card', request.url))
      }

      if (subStatus) response.headers.set('x-subscription-status', subStatus)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * S'applique à toutes les routes SAUF :
     * - _next/static / _next/image (assets)
     * - fichiers statiques (images, fonts, icônes)
     * - api/ (routes API — pas de session middleware ici)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$|api/).*)',
  ],
}
