import {
  User, Lock, Store, CreditCard, Package, Receipt,
  Link2, Upload, Bell, Globe, LogOut, Trash2, ChevronRight,
} from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────

type SettingsLink = {
  kind: 'link'
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  subtitle?: string
  href: string
  danger?: boolean
}

type SettingsAction = {
  kind: 'signout'
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
}

type SettingsItem = SettingsLink | SettingsAction

type SettingsSection = {
  title: string
  danger?: boolean
  items: SettingsItem[]
}

// ── Data ──────────────────────────────────────────────────────

const SECTIONS: SettingsSection[] = [
  {
    title: 'Votre compte',
    items: [
      {
        kind: 'link', href: '/dashboard/parametres/profil',
        icon: User,       iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',
        label: 'Informations personnelles', subtitle: 'Nom, prénom, email',
      },
      {
        kind: 'link', href: '/dashboard/parametres/securite',
        icon: Lock,       iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',
        label: 'Sécurité et mot de passe', subtitle: 'Modifier votre mot de passe',
      },
      {
        kind: 'link', href: '/dashboard/parametres/restaurant',
        icon: Store,      iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',
        label: 'Mon restaurant',            subtitle: 'Nom, adresse, SIRET',
      },
    ],
  },
  {
    title: 'Abonnement',
    items: [
      {
        kind: 'link', href: '/dashboard/parametres/abonnement',
        icon: CreditCard, iconBg: 'bg-green-100',   iconColor: 'text-green-600',
        label: 'Mon abonnement et facturation', subtitle: 'Gérer votre plan actuel',
      },
      {
        kind: 'link', href: '/pricing',
        icon: Package,    iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',
        label: 'Changer de plan',               subtitle: 'Comparer tous les plans',
      },
      {
        kind: 'link', href: '/dashboard/parametres/factures',
        icon: Receipt,    iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',
        label: 'Historique des factures',       subtitle: 'Télécharger vos reçus',
      },
    ],
  },
  {
    title: 'Intégrations',
    items: [
      {
        kind: 'link', href: '/dashboard/parametres/integrations',
        icon: Link2,  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',
        label: 'Caisses enregistreuses',    subtitle: 'Lightspeed, Tiller, Zelty',
      },
      {
        kind: 'link', href: '/dashboard/parametres/import',
        icon: Upload, iconBg: 'bg-pink-100',    iconColor: 'text-pink-600',
        label: 'Importer mes ventes (CSV)', subtitle: 'Upload manuel de ventes',
      },
    ],
  },
  {
    title: 'Préférences',
    items: [
      {
        kind: 'link', href: '/dashboard/parametres/notifications',
        icon: Bell,  iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
        label: 'Notifications',  subtitle: 'Emails et alertes',
      },
      {
        kind: 'link', href: '/dashboard/parametres/langue',
        icon: Globe, iconBg: 'bg-cyan-100',   iconColor: 'text-cyan-600',
        label: 'Langue et région', subtitle: 'Français · Europe/Paris',
      },
    ],
  },
  {
    title: 'Zone de danger',
    danger: true,
    items: [
      { kind: 'signout', icon: LogOut, iconBg: 'bg-red-100', iconColor: 'text-red-600', label: 'Se déconnecter' },
      {
        kind: 'link', href: '/dashboard/parametres/supprimer-compte',
        icon: Trash2, iconBg: 'bg-red-100', iconColor: 'text-red-600',
        label: 'Supprimer mon compte', danger: true,
      },
    ],
  },
]

// ── Sub-components ─────────────────────────────────────────────

function SectionLabel({ title, danger }: { title: string; danger?: boolean }) {
  return (
    <p
      className="text-xs font-semibold tracking-widest uppercase px-1 mb-2"
      style={{ color: danger ? '#DC2626' : 'var(--rp-navy-muted)' }}
    >
      {title}
    </p>
  )
}

function ItemIcon({ bg, color, Icon }: { bg: string; color: string; Icon: React.ElementType }) {
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
    </div>
  )
}

function ItemContent({ label, subtitle, danger }: { label: string; subtitle?: string; danger?: boolean }) {
  return (
    <div className="flex-1 min-w-0">
      <p
        className="text-sm font-medium"
        style={{ color: danger ? '#DC2626' : 'var(--rp-navy)' }}
      >
        {label}
      </p>
      {subtitle && (
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--rp-navy-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function SettingsGroup({ items }: { items: SettingsItem[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:   'var(--rp-white)',
        border:       '1px solid var(--rp-lavender-light)',
        boxShadow:    'var(--rp-shadow-card)',
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const divider = !isLast && (
          <div className="h-px ml-[52px]" style={{ background: 'var(--rp-lavender-light)' }} />
        )

        if (item.kind === 'signout') {
          return (
            <div key={item.label}>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 text-left"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--rp-lavender-light)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ItemIcon bg={item.iconBg} color={item.iconColor} Icon={item.icon} />
                  <ItemContent label={item.label} danger />
                </button>
              </form>
              {divider}
            </div>
          )
        }

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 group"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <ItemIcon bg={item.iconBg} color={item.iconColor} Icon={item.icon} />
              <ItemContent label={item.label} subtitle={item.subtitle} danger={item.danger} />
              <ChevronRight
                className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: 'var(--rp-lavender)' }}
              />
            </Link>
            {divider}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function ParametresPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <h1
        className="text-2xl font-extrabold"
        style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}
      >
        Paramètres
      </h1>

      {SECTIONS.map(section => (
        <div key={section.title}>
          <SectionLabel title={section.title} danger={section.danger} />
          <SettingsGroup items={section.items} />
        </div>
      ))}
    </div>
  )
}
