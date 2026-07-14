import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/auth'
import { EmployeeHeader } from '@/components/employee/EmployeeHeader'

export const metadata: Metadata = {
  title:       'Mon espace — PilotResto',
  description: 'Consultez votre planning',
}

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
  ])

  if (!user) redirect('/login')

  const firstName = profile?.first_name ?? ''

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <EmployeeHeader firstName={firstName} />
      <main style={{ padding: '24px 20px', maxWidth: '720px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
