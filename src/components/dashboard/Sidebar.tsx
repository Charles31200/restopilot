'use client'

/**
 * Sidebar — Navigation desktop uniquement (lg+).
 * Sur mobile, c'est BottomNav qui prend le relais.
 *
 * Couleurs : palette RestoPilot (navy, amber, lavender).
 * État actif  : fond amber-light, texte/icône amber.
 * État inactif: texte navy-muted, hover lavender-light.
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, CalendarDays, Receipt,
  Settings, SlidersHorizontal, CreditCard, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'
import { cn } from '@/lib/utils/cn'

// ── Navigation ────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Tableau de bord', icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/stocks',       label: 'Stocks',          icon: Package,         exact: false },
  { href: '/dashboard/planning',     label: 'Planning',        icon: CalendarDays,    exact: false },
  { href: '/dashboard/comptabilite', label: 'Comptabilité',    icon: Receipt,         exact: false },
] as const

// Intégrations et Abonnement ont leur propre route directe.
// Paramètres = hub /dashboard/parametres, actif sur toutes les sous-pages sauf
// /integrations et /abonnement (qui ont leur propre item).
type BottomItem = {
  href:     string
  label:    string
  icon:     React.ElementType
  isActive: (pathname: string) => boolean
}

const BOTTOM_ITEMS: BottomItem[] = [
  {
    href:     '/dashboard/parametres',
    label:    'Paramètres',
    icon:     SlidersHorizontal,
    isActive: (p) =>
      p === '/dashboard/parametres' ||
      (p.startsWith('/dashboard/parametres/') &&
        !p.startsWith('/dashboard/parametres/integrations') &&
        !p.startsWith('/dashboard/parametres/abonnement')),
  },
  {
    href:     '/dashboard/parametres/integrations',
    label:    'Intégrations',
    icon:     Settings,
    isActive: (p) => p.startsWith('/dashboard/parametres/integrations'),
  },
  {
    href:     '/dashboard/parametres/abonnement',
    label:    'Abonnement',
    icon:     CreditCard,
    isActive: (p) => p.startsWith('/dashboard/parametres/abonnement'),
  },
]

// ── Types ─────────────────────────────────────────────────────

type SidebarProps = {
  restaurantName: string
  userInitials:   string
  userFullName:   string
  userEmail:      string
}

// ── Composant ─────────────────────────────────────────────────

export function Sidebar({ restaurantName, userInitials, userFullName, userEmail }: SidebarProps) {
  const pathname  = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        // Desktop uniquement — BottomNav gère le mobile
        'hidden lg:flex flex-col fixed left-0 top-0 h-full z-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
      style={{
        background:  'var(--rp-navy)',
        borderRight: '1px solid rgba(255,255,255,.08)',
      }}
    >
      {/* ── Logo & nom restaurant ──────────────────────────── */}
      <div
        className={cn(
          'flex items-center h-16 px-4 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--rp-amber)' }}
            >
              <span
                className="text-white font-bold text-xs select-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                RP
              </span>
            </div>
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--rp-white)', fontFamily: 'var(--font-display)' }}
            >
              {restaurantName}
            </span>
          </div>
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--rp-amber)' }}
          >
            <span className="text-white font-bold text-xs select-none" style={{ fontFamily: 'var(--font-display)' }}>
              RP
            </span>
          </div>
        )}

        {/* Bouton réduire / déplier */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            collapsed && 'absolute -right-3 top-[18px] w-6 h-6 rounded-full border flex items-center justify-center shadow-sm'
          )}
          style={{
            color:      'rgba(255,255,255,.5)',
            background: collapsed ? 'var(--rp-navy)' : 'transparent',
            borderColor: collapsed ? 'rgba(255,255,255,.12)' : 'transparent',
          }}
          aria-label={collapsed ? 'Déplier' : 'Réduire'}
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft  className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ── Navigation principale ──────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-all duration-150 group',
                collapsed && 'justify-center px-0'
              )}
              style={{
                background: active ? 'var(--rp-amber-light)'  : 'transparent',
                color:      active ? 'var(--rp-amber-dark)'   : 'rgba(255,255,255,.55)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icon
                className="flex-shrink-0 transition-colors"
                size={20}
                strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? 'var(--rp-amber)' : 'rgba(255,255,255,.4)' }}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--rp-amber)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Navigation bas (paramètres + profil) ──────────── */}
      <div
        className="px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}
      >
        {BOTTOM_ITEMS.map(item => {
          const active = item.isActive(pathname)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-0'
              )}
              style={{
                background: active ? 'var(--rp-amber-light)' : 'transparent',
                color:      active ? 'var(--rp-amber-dark)'  : 'rgba(255,255,255,.55)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icon
                className="flex-shrink-0"
                size={20}
                strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? 'var(--rp-amber)' : 'rgba(255,255,255,.4)' }}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* Profil utilisateur */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 mt-1',
            collapsed && 'flex-col gap-1.5 px-0'
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 select-none"
            style={{
              background: 'var(--rp-amber-light)',
              color:      'var(--rp-amber-dark)',
              fontFamily: 'var(--font-display)',
            }}
            title={userFullName}
          >
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: 'var(--rp-white)', fontFamily: 'var(--font-display)' }}
              >
                {userFullName}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,.4)' }}>
                {userEmail}
              </p>
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              title="Se déconnecter"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,.35)' }}
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
