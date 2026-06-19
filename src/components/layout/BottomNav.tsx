'use client'

/**
 * BottomNav — Navigation principale sur mobile.
 *
 * Remplace la Sidebar sur écrans < lg (1024px).
 * Affichage : 5 onglets avec icône + label court.
 * Onglet actif : icône + texte amber, point indicateur amber.
 * Onglet inactif : icône + texte navy-muted.
 *
 * Loi du pouce : height 72px + safe-area-inset-bottom,
 * aucun onglet ne dépasse 100% de la zone thumb zone (bas de l'écran).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, CalendarDays, Receipt, MoreHorizontal,
  Settings, SlidersHorizontal, CreditCard, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { signOutAction } from '@/lib/supabase/actions'

// ── Onglets principaux ────────────────────────────────────────

const NAV_TABS = [
  {
    href:  '/dashboard',
    label: 'Accueil',
    icon:  LayoutDashboard,
    exact: true,
  },
  {
    href:  '/dashboard/stocks',
    label: 'Stocks',
    icon:  Package,
    exact: false,
  },
  {
    href:  '/dashboard/planning',
    label: 'Planning',
    icon:  CalendarDays,
    exact: false,
  },
  {
    href:  '/dashboard/comptabilite',
    label: 'Compta',
    icon:  Receipt,
    exact: false,
  },
] as const

// ── Menu "Plus" (overflow) ─────────────────────────────────────

const MORE_ITEMS = [
  { href: '/dashboard/parametres',              label: 'Paramètres',          icon: SlidersHorizontal },
  { href: '/dashboard/parametres/integrations', label: 'Intégrations caisse', icon: Settings },
  { href: '/dashboard/parametres/abonnement',   label: 'Abonnement',          icon: CreditCard },
] as const

// ── Composant ─────────────────────────────────────────────────

type BottomNavProps = {
  restaurantName: string
}

export function BottomNav({ restaurantName }: BottomNavProps) {
  const pathname  = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  // L'onglet "Plus" est actif si on est sur une route non couverte par les 4 onglets
  const isMoreActive = !NAV_TABS.some(t => isActive(t.href, t.exact))

  return (
    <>
      {/* ── Barre de navigation ───────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background:   'var(--rp-white)',
          borderTop:    '1px solid var(--rp-lavender)',
          boxShadow:    'var(--rp-shadow-bottom-nav)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Navigation principale"
      >
        <div className="flex items-center h-[72px]">
          {/* 4 onglets principaux */}
          {NAV_TABS.map(tab => {
            const active = isActive(tab.href, tab.exact)
            const Icon   = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5',
                  'min-h-[48px] relative transition-colors duration-150',
                  '-webkit-tap-highlight-color: transparent'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 1.75}
                  className="transition-colors duration-150"
                  style={{ color: active ? 'var(--rp-amber)' : 'var(--rp-navy-muted)' }}
                />
                <span
                  className="text-[10px] font-medium leading-none transition-colors duration-150"
                  style={{
                    color:      active ? 'var(--rp-amber)' : 'var(--rp-navy-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {tab.label}
                </span>
                {/* Indicateur dot actif */}
                {active && (
                  <span
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: 'var(--rp-amber)' }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}

          {/* Onglet "Plus" */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] relative"
            aria-label="Plus d'options"
          >
            <MoreHorizontal
              size={24}
              strokeWidth={isMoreActive ? 2.5 : 1.75}
              style={{ color: isMoreActive ? 'var(--rp-amber)' : 'var(--rp-navy-muted)' }}
            />
            <span
              className="text-[10px] font-medium leading-none"
              style={{
                color:      isMoreActive ? 'var(--rp-amber)' : 'var(--rp-navy-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Plus
            </span>
            {isMoreActive && (
              <span
                className="absolute bottom-1.5 w-1 h-1 rounded-full"
                style={{ background: 'var(--rp-amber)' }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </nav>

      {/* ── Bottom Sheet "Plus" ───────────────────────────── */}
      <BottomSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={restaurantName}
        description="Paramètres et gestion du compte"
      >
        <div className="space-y-1 -mx-1">
          {MORE_ITEMS.map(item => {
            const Icon   = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors',
                  active
                    ? 'bg-rp-amber-light'
                    : 'hover:bg-rp-lavender-light'
                )}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? 'var(--rp-amber)' : 'var(--rp-lavender-light)',
                  }}
                >
                  <Icon
                    size={18}
                    style={{ color: active ? 'var(--rp-white)' : 'var(--rp-navy-muted)' }}
                  />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: active ? 'var(--rp-amber-dark)' : 'var(--rp-navy)' }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Déconnexion */}
          <div className="pt-2 mt-2 border-t border-rp-lavender-light">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-rp-danger-bg transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-rp-lavender-light flex items-center justify-center flex-shrink-0">
                  <LogOut size={18} className="text-rp-navy-muted" />
                </div>
                <span className="text-sm font-medium text-rp-danger">Se déconnecter</span>
              </button>
            </form>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
