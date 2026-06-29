'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, CalendarDays, Receipt,
  UtensilsCrossed, Settings, CreditCard, SlidersHorizontal,
  Bell, Menu, X, LogOut, User,
} from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'

// ── Navigation ────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Tableau de bord', shortLabel: 'Accueil',   icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/stocks',       label: 'Stocks',          shortLabel: 'Stocks',    icon: Package,         exact: false },
  { href: '/dashboard/menu',         label: 'Menu & Recettes', shortLabel: 'Menu',      icon: UtensilsCrossed, exact: false },
  { href: '/dashboard/planning',     label: 'Planning',        shortLabel: 'Planning',  icon: CalendarDays,    exact: false },
  { href: '/dashboard/comptabilite', label: 'Comptabilité',    shortLabel: 'Compta',    icon: Receipt,         exact: false },
  { href: '/dashboard/parametres/integrations', label: 'Intégrations', shortLabel: 'Intégrations', icon: Settings, exact: false },
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
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const [signing,        setSigning]        = useState(false)

  const dropdownRef    = useRef<HTMLDivElement>(null)
  const avatarBtnRef   = useRef<HTMLButtonElement>(null)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  // Ferme dropdown au clic extérieur
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const t = e.target as Node
      if (
        dropdownRef.current  && !dropdownRef.current.contains(t) &&
        avatarBtnRef.current && !avatarBtnRef.current.contains(t)
      ) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [userMenuOpen])

  // Ferme le menu mobile à chaque navigation
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const handleSignOut = async () => {
    setSigning(true)
    document.cookie = 'remember_session=; path=/; max-age=0'
    localStorage.removeItem('pilotresto-session')
    await signOutAction()
  }

  // ── User dropdown partagé ─────────────────────────────────
  const UserDropdown = () => (
    <div
      ref={dropdownRef}
      className="fixed z-[60] w-56 rounded-[16px] overflow-hidden"
      style={{
        bottom:      '12px',
        left:        '60px',
        background:  '#FFFFFF',
        border:      '1px solid #EEEEEE',
        boxShadow:   '0 8px 32px rgba(0,0,0,0.14)',
      }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: '#EEEEEE' }}>
        <p className="text-[13px] font-semibold truncate" style={{ color: '#111111' }}>{userFullName}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#888888' }}>{userEmail}</p>
      </div>
      <div className="py-1">
        <a
          href="/dashboard/compte"
          onClick={() => setUserMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-gray-50"
          style={{ color: '#111111' }}
        >
          <User size={14} style={{ color: '#888888' }} />
          Mon profil
        </a>
        {MORE_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setUserMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-gray-50"
            style={{ color: '#111111' }}
          >
            <item.icon size={14} style={{ color: '#888888' }} />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="border-t py-1" style={{ borderColor: '#EEEEEE' }}>
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
  )

  return (
    <>
      {/* ══ SIDEBAR — desktop uniquement ═════════════════════ */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col items-center py-3 gap-1"
        style={{ width: '52px', background: '#111111' }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="mb-3 flex-shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
        </Link>

        {/* Nav icons */}
        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={item.label}
                className="flex items-center justify-center rounded-[10px] transition-all duration-150"
                style={{
                  width:      '36px',
                  height:     '36px',
                  color:      active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}
              >
                <item.icon size={20} />
              </Link>
            )
          })}
        </nav>

        {/* Avatar bas de sidebar */}
        <button
          ref={avatarBtnRef}
          type="button"
          onClick={() => setUserMenuOpen(v => !v)}
          className="mt-auto flex-shrink-0"
          aria-label="Menu utilisateur"
          aria-expanded={userMenuOpen}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] select-none"
            style={{ background: '#7798AB', color: 'white', fontFamily: 'var(--font-display)' }}
          >
            {userInitials}
          </div>
        </button>

        {userMenuOpen && <UserDropdown />}
      </aside>

      {/* ══ HEADER TOP ════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{ height: '48px', background: '#FFFFFF', borderBottom: '1px solid #EEEEEE' }}
      >
        <div className="flex items-center h-full px-4 gap-3 md:pl-[68px]">
          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            style={{ color: '#111111', flexShrink: 0 }}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Nom du restaurant */}
          <span
            className="flex-1 truncate text-[15px]"
            style={{ color: '#111111', fontWeight: 600, fontFamily: 'var(--font-display)' }}
          >
            {restaurantName}
          </span>

          {/* Cloche */}
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: '#888888' }}
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>

          {/* Avatar (mobile header uniquement — desktop dans la sidebar) */}
          <button
            type="button"
            onClick={() => setUserMenuOpen(v => !v)}
            className="md:hidden flex-shrink-0"
            aria-label="Menu utilisateur"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[11px] select-none"
              style={{ background: '#7798AB', color: 'white', fontFamily: 'var(--font-display)' }}
            >
              {userInitials}
            </div>
          </button>
        </div>
      </header>

      {/* ══ MENU MOBILE DÉROULANT ════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="fixed left-0 right-0 z-30 md:hidden"
          style={{
            top:          '48px',
            background:   '#FFFFFF',
            borderBottom: '1px solid #EEEEEE',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.08)',
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
                    color:      active ? '#111111' : '#888888',
                    background: active ? '#F5F4F0' : 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize:   '14px',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="px-3 pb-3 border-t" style={{ borderColor: '#EEEEEE' }}>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signing}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] transition-colors text-red-500 hover:bg-red-50 disabled:opacity-60"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <LogOut size={17} />
              {signing ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </div>
        </div>
      )}

      {/* ══ BOTTOM NAV — mobile uniquement ═══════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          height:        '64px',
          background:    '#FFFFFF',
          borderTop:     '1px solid #EEEEEE',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {NAV_ITEMS.slice(0, 5).map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors"
              style={{ color: active ? '#111111' : '#BBBBBB' }}
            >
              <item.icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400, fontFamily: 'var(--font-body)' }}>
                {item.shortLabel}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
