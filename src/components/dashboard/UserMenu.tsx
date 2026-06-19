'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Lock, FileText, Mail, LogOut, ChevronDown } from 'lucide-react'
import { signOutAction } from '@/lib/supabase/actions'

type Props = {
  userFullName: string
  userEmail:    string
  userInitials: string
}

const MENU_ITEMS = [
  { icon: User,     label: 'Mon profil',         href: '/dashboard/compte' },
  { icon: Lock,     label: 'Confidentialité',     href: '/politique-de-confidentialite' },
  { icon: FileText, label: 'CGU / CGV',           href: '/cgu-cgv' },
  { icon: Mail,     label: 'Contact',             href: 'mailto:charles.lecussan@gmail.com' },
]

export function UserMenu({ userFullName, userEmail, userInitials }: Props) {
  const [open,    setOpen]    = useState(false)
  const [signing, setSigning] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSignOut = async () => {
    setSigning(true)
    await signOutAction()
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger — avatar avec initiales */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full transition-all duration-200 hover:opacity-80 active:scale-95"
        title={userFullName}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs select-none"
          style={{
            background: 'var(--rp-amber-light)',
            color:      'var(--rp-amber-dark)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {userInitials}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 hidden sm:block ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--rp-navy-muted)' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl border shadow-xl z-50 overflow-hidden"
          style={{
            background:   'var(--rp-white)',
            borderColor:  'var(--rp-lavender)',
            boxShadow:    'var(--rp-shadow-card)',
            animation:    'userMenuIn 150ms cubic-bezier(0.32,0.72,0,1) forwards',
          }}
        >
          {/* En-tête identité */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--rp-lavender-light)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--rp-navy)' }}>
              {userFullName}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
              {userEmail}
            </p>
          </div>

          {/* Liens */}
          <div className="py-1">
            {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[var(--rp-lavender-light)]"
                style={{ color: 'var(--rp-navy)' }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rp-navy-muted)' }} />
                {label}
              </a>
            ))}
          </div>

          {/* Séparateur + déconnexion */}
          <div className="border-t py-1" style={{ borderColor: 'var(--rp-lavender-light)' }}>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signing}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {signing ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </div>
        </div>
      )}

      {/* Animation keyframe injectée via style global */}
      <style>{`
        @keyframes userMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  )
}
