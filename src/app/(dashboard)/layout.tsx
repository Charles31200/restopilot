import { redirect }         from 'next/navigation'
import type { Metadata }    from 'next'
import { getCurrentUser, getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { TopBar }                   from '@/components/dashboard/TopBar'
import { TrialBanner }              from '@/components/dashboard/TrialBanner'
import { DashboardContentWrapper }  from '@/components/dashboard/DashboardContentWrapper'

export const metadata: Metadata = {
  title:       'PilotResto',
  description: 'Tableau de bord PilotResto',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, profile, restaurant] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCurrentRestaurant(),
  ])

  if (!user) redirect('/login')

  const firstName    = profile?.first_name ?? ''
  const lastName     = profile?.last_name  ?? ''
  const userFullName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : user.email ?? ''
  const userInitials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user.email?.[0] ?? 'U').toUpperCase()
  const restaurantName = restaurant?.name ?? 'Mon restaurant'

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>

      {/* ── Sidebar + Header ─────────────────────────────── */}
      <TopBar
        restaurantName={restaurantName}
        userInitials={userInitials}
        userFullName={userFullName}
        userEmail={user.email ?? ''}
      />

      {/* ── Contenu : décalé header (52px, +28px en Electron) + sidebar desktop collapsed (72px) + bottom nav mobile (64px) */}
      <DashboardContentWrapper>
        {/* ── Bannière essai ───────────────────────────────── */}
        <TrialBanner />

        {/* ── Contenu principal ────────────────────────────── */}
        <main style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer
          className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 py-4 text-[11px] border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
        >
          <span>© 2026 PilotResto</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <a href="/cgu-cgv"                      className="hover:text-white transition-colors">CGU / CGV</a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <a href="/politique-de-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <a href="mailto:charles.lecussan@gmail.com" className="hover:text-white transition-colors">Contact</a>
        </footer>
      </DashboardContentWrapper>
    </div>
  )
}
