'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, CalendarDays, User } from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'

const NAV_ITEMS = [
  { href: '/employee/dashboard', label: 'Planning', icon: CalendarDays },
  { href: '/employee/profil',    label: 'Profil',   icon: User },
]

export function EmployeeHeader({ firstName }: { firstName: string }) {
  const [signing, setSigning] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    setSigning(true)
    document.cookie = 'remember_session=; path=/; max-age=0'
    localStorage.removeItem('pilotresto-session')
    await signOutAction()
  }

  return (
    <header style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-4 sm:px-6" style={{ height: '60px' }}>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />
          <span className="font-bold text-[15px]" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            PilotResto
          </span>
        </div>

        <div className="flex items-center gap-3">
          {firstName && (
            <span className="text-[13px] hidden sm:inline" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}>
              {firstName}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signing}
            className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] text-[13px] font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">{signing ? 'Déconnexion…' : 'Déconnexion'}</span>
          </button>
        </div>
      </div>

      {/* Onglets de navigation — simples, mobile-first */}
      <nav className="flex items-center gap-1 px-4 sm:px-6" style={{ height: '44px' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 h-full px-3 text-[13px] font-medium transition-colors"
              style={{
                color: active ? '#7798AB' : 'rgba(255,255,255,0.45)',
                borderBottom: active ? '2px solid #7798AB' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
