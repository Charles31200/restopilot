import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser, getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { EmployeeDashboardClient } from '@/components/employee/EmployeeDashboardClient'

export const metadata: Metadata = { title: 'Mon planning — PilotResto' }

export default async function EmployeeDashboardPage() {
  const [user, profile, restaurant] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCurrentRestaurant(),
  ])

  if (!user) redirect('/login')

  const firstName     = profile?.first_name ?? ''
  const restaurantName = restaurant?.name ?? 'votre restaurant'
  const employeeId     = profile?.employee_id ?? null

  return (
    <div className="space-y-5">
      {/* ── Carte de bienvenue ─────────────────────────── */}
      <div
        className="rounded-[20px] p-6"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h1 className="font-semibold" style={{ fontSize: '22px', color: '#FFFFFF', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
          Bonjour {firstName || 'à vous'} 👋
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
          {restaurantName}
        </p>
      </div>

      {employeeId ? (
        <EmployeeDashboardClient employeeId={employeeId} />
      ) : (
        <div
          className="rounded-[20px] p-6 text-center"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
            Votre compte n&apos;est relié à aucune fiche employé. Contactez votre employeur.
          </p>
        </div>
      )}
    </div>
  )
}
