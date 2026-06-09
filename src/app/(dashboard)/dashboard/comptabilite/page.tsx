'use client'

import { useState } from 'react'
import { TrendingUp, FileText, BarChart3, Camera } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { FAB }          from '@/components/ui/FAB'
import { Badge }        from '@/components/ui/Badge'
import { BottomSheet }  from '@/components/ui/BottomSheet'
import { FinancialDashboard } from '@/components/comptabilite/FinancialDashboard'
import { InvoiceScanner }    from '@/components/comptabilite/InvoiceScanner'
import { InvoicesList }      from '@/components/comptabilite/InvoicesList'
import { WeeklyReport }      from '@/components/comptabilite/WeeklyReport'
import { FECExport }         from '@/components/comptabilite/FECExport'
import type { InvoiceExtended } from '@/types/comptabilite'

// ── Onglets ───────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard', label: 'Résumé',   icon: TrendingUp },
  { id: 'invoices',  label: 'Factures', icon: FileText   },
  { id: 'reports',   label: 'Rapports', icon: BarChart3  },
] as const

type TabId = (typeof TABS)[number]['id']

// ── Page ──────────────────────────────────────────────────────

export default function ComptabilitePage() {
  const [tab,           setTab]        = useState<TabId>('dashboard')
  const [newInvoice,    setNewInvoice]  = useState<InvoiceExtended | null>(null)
  const [scannerOpen,   setScannerOpen] = useState(false)

  return (
    <>
      {/* Header mobile */}
      <MobileHeader title="Comptabilité" variant="light" />

      {/* Titre desktop */}
      <div className="hidden lg:block mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Comptabilité
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--rp-navy-muted)' }}>
          Finances, factures et exports pour votre comptable
        </p>
      </div>

      {/* ── Onglets — ligne amber sous l'actif ─────────── */}
      <div
        className="flex border-b mb-4"
        style={{ borderColor: 'var(--rp-lavender-light)' }}
      >
        {TABS.map(t => {
          const Icon   = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex items-center gap-2 px-4 pb-3 pt-1 text-[14px] font-medium transition-colors min-h-[48px]"
              style={{
                color:      active ? 'var(--rp-amber)' : 'var(--rp-navy-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? 'var(--rp-amber)' : 'var(--rp-navy-muted)' }}
              />
              {t.label}
              {/* Indicateur ligne active */}
              {active && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: 'var(--rp-amber)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Contenu ─────────────────────────────────────── */}

      {tab === 'dashboard' && <FinancialDashboard />}

      {tab === 'invoices' && (
        <>
          {/* Desktop : colonnes côte à côte */}
          <div className="hidden xl:grid xl:grid-cols-5 gap-6">
            <div className="xl:col-span-2">
              <div
                className="rounded-[16px] p-5"
                style={{ background: 'var(--rp-white)', border: '1px solid var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}
              >
                <h2 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
                  Scanner une facture
                </h2>
                <InvoiceScanner onSaved={inv => setNewInvoice(inv)} />
              </div>
            </div>
            <div className="xl:col-span-3">
              <InvoicesList newInvoice={newInvoice} />
            </div>
          </div>

          {/* Mobile : liste + FAB camera */}
          <div className="xl:hidden">
            <InvoicesList newInvoice={newInvoice} />
          </div>

          {/* FAB Scanner (mobile) */}
          <FAB
            icon={<Camera size={24} strokeWidth={2} color="white" />}
            label="Scanner une facture"
            onClick={() => setScannerOpen(true)}
          />

          {/* Bottom Sheet Scanner */}
          <BottomSheet
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            title="Scanner une facture"
            description="Photo ou PDF — l'IA détecte automatiquement les informations"
          >
            <InvoiceScanner onSaved={inv => { setNewInvoice(inv); setScannerOpen(false) }} />
          </BottomSheet>
        </>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeeklyReport />
          <FECExport />
        </div>
      )}
    </>
  )
}
