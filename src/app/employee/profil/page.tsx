import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentProfile, getCurrentRestaurant } from '@/lib/supabase/auth'
import { EmployeeProfileClient } from '@/components/employee/EmployeeProfileClient'
import type { Employee } from '@/types'

export const metadata: Metadata = { title: 'Mon profil — PilotResto' }

export default async function EmployeeProfilePage() {
  const [user, profile, restaurant] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCurrentRestaurant(),
  ])

  if (!user) redirect('/login')

  let employee: Pick<Employee, 'first_name' | 'last_name' | 'role' | 'contract_type'> | null = null
  if (profile?.employee_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('employees')
      .select('first_name, last_name, role, contract_type')
      .eq('id', profile.employee_id)
      .single()
    employee = data
  }

  return (
    <EmployeeProfileClient
      email={user.email ?? ''}
      firstName={employee?.first_name ?? profile?.first_name ?? ''}
      lastName={employee?.last_name ?? profile?.last_name ?? ''}
      poste={employee?.role ?? null}
      contractType={employee?.contract_type ?? null}
      restaurantName={restaurant?.name ?? 'votre restaurant'}
    />
  )
}
