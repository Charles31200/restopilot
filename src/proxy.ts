// ─────────────────────────────────────────────────────────────
// proxy.ts — remplace middleware.ts (déprécié depuis Next.js 16)
// Responsabilités :
//  1. Vérifier l'authentification Supabase (session JWT)
//  2. Vérifier le statut d'abonnement Stripe
//  3. Bloquer l'accès si abonnement expiré ou suspendu (> 7j)
//  4. Injecter un header X-Subscription-Status pour les Server Components
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes du dashboard non bloquées même si abonnement expiré
// (évite la boucle infinie si l'utilisateur est sur /subscription-expired)
const ALWAYS_ALLOWED_DASHBOARD = [
  '/parametres/abonnement',
  '/subscription-expired',
  '/upgrade',
  '/pricing',
]

// Délai de grâce après expiration / past_due avant blocage (7 jours en ms)
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── Client Supabase edge (lecture seule, anon key) ────────────
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

  // ── 1. Vérification auth ──────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute      = pathname === '/login' || pathname === '/register'
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isOnboarding     = pathname === '/onboarding'

  // Non connecté → /login (protège dashboard ET onboarding)
  if (!user && (isDashboardRoute || isOnboarding)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Déjà connecté → éviter les pages auth
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 2. Vérification onboarding + abonnement (routes dashboard) ──
  if (user && isDashboardRoute) {
    // Ne pas bloquer les routes de gestion d'abonnement (évite boucle infinie)
    const isExempt = ALWAYS_ALLOWED_DASHBOARD.some(p => pathname.startsWith(p)) ||
                     pathname === '/subscription-expired'

    try {
      // Une seule requête pour onboarding + abonnement
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, first_name')
        .eq('id', user.id)
        .single()

      // Onboarding incomplet → rediriger (toutes les routes dashboard, même les exemptées)
      if (profile && !profile.first_name) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      if (!isExempt && profile?.restaurant_id) {
        // Lire le statut d'abonnement
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, current_period_end, updated_at')
          .eq('restaurant_id', profile.restaurant_id)
          .single()

        if (sub) {
          const status     = sub.status as string
          const updatedAt  = sub.updated_at ? new Date(sub.updated_at).getTime() : 0
          const periodEnd  = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0
          const now        = Date.now()

          // Bloquer si :
          //  - statut 'canceled' ET la période est terminée
          //  - statut 'past_due' ET en retard depuis > 7 jours
          const shouldBlock =
            (status === 'canceled' && periodEnd > 0 && periodEnd < now) ||
            (status === 'past_due' && updatedAt > 0 && now - updatedAt > GRACE_PERIOD_MS)

          if (shouldBlock) {
            return NextResponse.redirect(new URL('/subscription-expired', request.url))
          }

          // Injecter le statut dans les headers pour les Server Components
          response.headers.set('x-subscription-status', status)
          response.headers.set('x-subscription-plan', sub.status)
        }
      }
    } catch {
      // En cas d'erreur DB, on laisse passer (fail-open)
      // pour ne pas bloquer des utilisateurs valides
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * S'applique à toutes les routes SAUF :
     * - _next/static   (assets compilés)
     * - _next/image    (optimisation image)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api/auth       (callback OAuth Supabase)
     * - api/webhooks   (webhooks Stripe — signature brute, pas de session)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/auth|api/webhooks).*)',
  ],
}
