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
const FULLY_PUBLIC = [
  '/landing', '/install', '/contact', '/pricing',
  '/cgu-cgv', '/politique-de-confidentialite',
]

// Routes dashboard accessibles sans abonnement actif (évite les boucles)
const SUBSCRIPTION_EXEMPT = [
  '/dashboard/parametres/abonnement',
  '/dashboard/compte',
  '/dashboard/upgrade',
  '/onboarding-payment',
]

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const { pathname } = request.nextUrl

  // ── 0. Routes publiques → court-circuit immédiat ─────────────
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

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute         = pathname === '/login' || pathname === '/register'
  const isDashboardRoute    = pathname.startsWith('/dashboard')
  const isOnboarding        = pathname === '/onboarding'
  const isOnboardingPayment = pathname === '/onboarding-payment'
  const needsAuth           = isDashboardRoute || isOnboarding || isOnboardingPayment

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
    const isPWA = request.cookies.get('pwa_installed')?.value === 'true'
    if (!isPWA) {
      return NextResponse.redirect(new URL('/install', request.url))
    }
  }

  // ── 5-6. Vérifications dashboard ──────────────────────────────
  if (isDashboardRoute) {
    const isExempt = SUBSCRIPTION_EXEMPT.some(p => pathname.startsWith(p))

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, first_name')
        .eq('id', user.id)
        .single()

      // 5. Onboarding incomplet → /onboarding
      if (!profile?.first_name) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // 6. Vérifier l'abonnement (sauf routes exemptées)
      if (!isExempt) {
        if (!profile.restaurant_id) {
          return NextResponse.redirect(new URL('/onboarding-payment', request.url))
        }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('restaurant_id', profile.restaurant_id)
          .single()

        // active | trialing → OK ; tout le reste → onboarding-payment
        const isActive = sub?.status === 'active' || sub?.status === 'trialing'

        if (!isActive) {
          const url = new URL('/onboarding-payment', request.url)
          url.searchParams.set('reason', 'subscription_required')
          return NextResponse.redirect(url)
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
     * - _next/static / _next/image (assets)
     * - fichiers statiques (images, fonts, icônes)
     * - api/ (routes API — pas de session middleware ici)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$|api/).*)',
  ],
}
