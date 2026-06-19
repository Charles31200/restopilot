import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser, getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { Sidebar }     from '@/components/dashboard/Sidebar'
import { BottomNav }   from '@/components/layout/BottomNav'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { UserMenu }    from '@/components/dashboard/UserMenu'

export const metadata: Metadata = {
  title: 'RestoPilot',
  description: 'Tableau de bord RestoPilot',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Récupération des données côté serveur
  const [user, profile, restaurant] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCurrentRestaurant(),
  ])

  if (!user) redirect('/login')

  // Dériver les initiales et le nom complet
  const firstName    = profile?.first_name ?? ''
  const lastName     = profile?.last_name  ?? ''
  const userFullName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : user.email ?? ''
  const userInitials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user.email?.[0] ?? 'U').toUpperCase()
  const restaurantName = restaurant?.name ?? 'Mon restaurant'
  const planId         = restaurant?.plan_id ?? 'starter'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--rp-bg-page)' }}>

      {/* ── Sidebar desktop (lg+) ───────────────────────────── */}
      <Sidebar
        restaurantName={restaurantName}
        userInitials={userInitials}
        userFullName={userFullName}
        userEmail={user.email ?? ''}
      />

      {/* ── Contenu principal ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 transition-all duration-300">

        {/* ── Header desktop (lg+) ─────────────────────────── */}
        <header
          className="hidden lg:flex sticky top-0 z-30 h-16 items-center px-6 gap-4"
          style={{
            background:  'var(--rp-white)',
            borderBottom: '1px solid var(--rp-lavender-light)',
            boxShadow:   'var(--rp-shadow-card)',
          }}
        >
          {/* Nom du restaurant */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
            >
              {restaurantName}
            </h2>
            <p className="text-xs capitalize" style={{ color: 'var(--rp-navy-muted)' }}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          {/* Badge plan */}
          <PlanBadge planId={planId} />

          {/* Avatar avec menu déroulant */}
          <UserMenu
            userFullName={userFullName}
            userEmail={user.email ?? ''}
            userInitials={userInitials}
          />
        </header>

        {/* ── Bannière essai gratuit (client component) ─────────── */}
        <TrialBanner />

        {/* ── Espace pour le MobileHeader fixe (mobile uniquement) ── */}
        {/*
          Les pages individuelles doivent inclure <MobileHeader> elles-mêmes
          pour contrôler le titre et les actions contextuelles.
          Ce spacer réserve l'espace en haut sur mobile.
        */}
        <div
          className="lg:hidden flex-shrink-0"
          style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }}
          aria-hidden="true"
        />

        {/* ── Zone de contenu ──────────────────────────────── */}
        <main
          className="flex-1 p-4 lg:p-6"
          style={{
            // Espace pour la BottomNav sur mobile
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          }}
        >
          <div className="lg:pb-0 [padding-bottom:0]">
            {/*
              Réinitialise le padding-bottom sur desktop :
              la classe inline ci-dessus est overridée par lg:pb-0
              mais Tailwind arbitraire [] a une priorité plus haute — on
              utilise le [lg:pb-0] ci-dessus pour desktop.
            */}
          </div>
          <div className="h-full">{children}</div>
        </main>

        {/* ── Footer discret (desktop uniquement) ─────────── */}
        <footer
          className="hidden lg:flex items-center justify-center flex-wrap gap-x-4 gap-y-1 py-3 text-xs border-t"
          style={{ borderColor: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)' }}
        >
          <span>© 2026 RestoPilot</span>
          <span style={{ color: 'var(--rp-lavender)' }}>·</span>
          <a href="/cgu-cgv"                      className="hover:text-gray-700 transition-colors">CGU / CGV</a>
          <span style={{ color: 'var(--rp-lavender)' }}>·</span>
          <a href="/politique-de-confidentialite" className="hover:text-gray-700 transition-colors">Politique de confidentialité</a>
          <span style={{ color: 'var(--rp-lavender)' }}>·</span>
          <a href="mailto:charles.lecussan@gmail.com" className="hover:text-gray-700 transition-colors">Contact</a>
        </footer>
      </div>

      {/* ── BottomNav mobile (< lg) ──────────────────────── */}
      <BottomNav restaurantName={restaurantName} />
    </div>
  )
}

// ── Badge plan ─────────────────────────────────────────────────

function PlanBadge({ planId }: { planId: string }) {
  const CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    starter: {
      label: 'Essai gratuit',
      bg:     'var(--rp-lavender-light)',
      color:  'var(--rp-navy-light)',
      border: 'var(--rp-lavender)',
    },
    pro: {
      label: 'Pro',
      bg:     'var(--rp-amber-light)',
      color:  'var(--rp-amber-dark)',
      border: 'var(--rp-amber)',
    },
    multi: {
      label: 'Multi-sites',
      bg:     'var(--rp-khaki-light)',
      color:  'var(--rp-khaki)',
      border: 'var(--rp-khaki)',
    },
  }
  const cfg = CONFIG[planId] ?? CONFIG.starter

  return (
    <span
      className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        background:   cfg.bg,
        color:        cfg.color,
        borderColor:  cfg.border,
        fontFamily:   'var(--font-body)',
      }}
    >
      {cfg.label}
    </span>
  )
}
