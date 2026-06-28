'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, CalendarDays, Receipt,
  UtensilsCrossed, Settings, CreditCard, SlidersHorizontal,
  Bell, Menu, X, LogOut, User, ChevronDown,
} from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'

// ── Navigation ────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Tableau de bord', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/stocks',       label: 'Stocks',          icon: Package,         exact: false },
  { href: '/dashboard/menu',         label: 'Menu & Recettes', icon: UtensilsCrossed, exact: false },
  { href: '/dashboard/planning',     label: 'Planning',        icon: CalendarDays,    exact: false },
  { href: '/dashboard/comptabilite', label: 'Comptabilité',    icon: Receipt,         exact: false },
  { href: '/dashboard/parametres/integrations', label: 'Intégrations', icon: Settings, exact: false },
] as const

const MORE_ITEMS = [
  { href: '/dashboard/parametres',            label: 'Paramètres', icon: SlidersHorizontal },
  { href: '/dashboard/parametres/abonnement', label: 'Abonnement', icon: CreditCard },
]

// ── Types ─────────────────────────────────────────────────────

type TopBarProps = {
  restaurantName: string
  userInitials:   string
  userFullName:   string
  userEmail:      string
}

// ── Composant ─────────────────────────────────────────────────

export function TopBar({ restaurantName, userInitials, userFullName, userEmail }: TopBarProps) {
  const pathname     = usePathname()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signing,    setSigning]       = useState(false)
  const userMenuRef  = useRef<HTMLDivElement>(null)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  // Ferme le user menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  // Ferme le menu mobile à chaque navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleSignOut = async () => {
    setSigning(true)
    document.cookie = 'remember_session=; path=/; max-age=0'
    localStorage.removeItem('pilotresto-session')
    await signOutAction()
  }

  return (
    <>
      {/* ── Barre fixe ───────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: '56px', background: '#0D1B1E' }}
      >
        <div
          className="flex items-center h-full px-4 gap-3"
          style={{ maxWidth: '1400px', margin: '0 auto' }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 flex-shrink-0 mr-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: 'auto' }} />
            <span
              className="text-white font-semibold text-[15px] hidden sm:block"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              PilotResto
            </span>
          </Link>

          {/* Nav items — desktop ─────────────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="relative flex flex-col items-center px-3 py-1.5 rounded-lg text-[13px] transition-all duration-150"
                  style={{
                    color:      active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#C3DBC5' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Droite ─────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Cloche */}
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            {/* Avatar + restaurant */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-full transition-all hover:bg-white/10"
                aria-expanded={userMenuOpen}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[11px] select-none flex-shrink-0"
                  style={{ background: '#7798AB', color: 'white', fontFamily: 'var(--font-display)' }}
                >
                  {userInitials}
                </div>
                <span
                  className="hidden lg:block text-[12px] max-w-[120px] truncate"
                  style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)' }}
                >
                  {restaurantName}
                </span>
                <ChevronDown
                  size={12}
                  className={`hidden lg:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                />
              </button>

              {/* Dropdown utilisateur */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-[16px] border overflow-hidden"
                  style={{
                    background:  '#FFFFFF',
                    borderColor: 'rgba(119,152,171,0.15)',
                    boxShadow:   '0 8px 32px rgba(0,0,0,0.12)',
                  }}
                >
                  {/* Identité */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(119,152,171,0.1)' }}>
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#0D1B1E' }}>
                      {userFullName}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: '#7798AB' }}>
                      {userEmail}
                    </p>
                  </div>
                  {/* Liens */}
                  <div className="py-1">
                    <a
                      href="/dashboard/compte"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-[rgba(119,152,171,0.06)]"
                      style={{ color: '#0D1B1E' }}
                    >
                      <User size={14} style={{ color: '#7798AB' }} />
                      Mon profil
                    </a>
                    {MORE_ITEMS.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-[rgba(119,152,171,0.06)]"
                        style={{ color: '#0D1B1E' }}
                      >
                        <item.icon size={14} style={{ color: '#7798AB' }} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  {/* Déconnexion */}
                  <div className="border-t py-1" style={{ borderColor: 'rgba(119,152,171,0.1)' }}>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signing}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <LogOut size={14} />
                      {signing ? 'Déconnexion…' : 'Se déconnecter'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu mobile déroulant ─────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed left-0 right-0 z-40 md:hidden"
          style={{
            top:          '56px',
            background:   '#0D1B1E',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <nav className="px-3 py-2 space-y-0.5">
            {[...NAV_ITEMS, ...MORE_ITEMS].map(item => {
              const active = 'exact' in item
                ? isActive(item.href, item.exact)
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                  style={{
                    color:      active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                    background: active ? 'rgba(119,152,171,0.15)' : 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize:   '14px',
                  }}
                >
                  <item.icon size={17} />
                  {item.label}
                  {active && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#C3DBC5' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="px-3 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signing}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] transition-colors"
              style={{ color: '#F87171', fontFamily: 'var(--font-body)' }}
            >
              <LogOut size={17} />
              {signing ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
