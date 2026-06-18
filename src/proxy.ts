// ─────────────────────────────────────────────────────────────
// proxy.ts — remplace middleware.ts (déprécié depuis Next.js 16)
//
// Règles d'accès :
//  1. Non connecté           → /login  (protège /dashboard + /onboarding)
//  2. Connecté sur page auth → /dashboard
//  3. Onboarding incomplet   → /onboarding
//  4. Pas d'abonnement actif → /pricing?reason=subscription_required
//  5. active | trialing      → accès autorisé
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes dashboard accessibles même sans abonnement actif (évite les boucles)
const SUBSCRIPTION_EXEMPT = [
  '/dashboard/parametres/abonnement',
  '/dashboard/compte',
  '/dashboard/upgrade',
]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute      = pathname === '/login' || pathname === '/register'
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isOnboarding     = pathname === '/onboarding'

  // ── 1. Non connecté → protéger dashboard et onboarding ───────
  if (!user && (isDashboardRoute || isOnboarding)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 2. Connecté → éviter les pages auth ──────────────────────
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 3. Vérifications dashboard ────────────────────────────────
  if (user && isDashboardRoute) {
    const isExempt = SUBSCRIPTION_EXEMPT.some(p => pathname.startsWith(p))

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, first_name')
        .eq('id', user.id)
        .single()

      // 3a. Onboarding incomplet → /onboarding
      if (!profile?.first_name) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // 3b. Vérifier l'abonnement (sauf routes exemptées)
      if (!isExempt && profile.restaurant_id) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('restaurant_id', profile.restaurant_id)
          .single()

        const isActive = sub?.status === 'active' || sub?.status === 'trialing'

        if (!isActive) {
          const pricingUrl = new URL('/pricing', request.url)
          pricingUrl.searchParams.set('reason', 'subscription_required')
          return NextResponse.redirect(pricingUrl)
        }

        response.headers.set('x-subscription-status', sub.status)
      }
    } catch {
      // Fail-open : ne pas bloquer des utilisateurs valides en cas d'erreur DB
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
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/).*)',
  ],
}
