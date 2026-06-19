'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Receipt, Download, ExternalLink, Loader2, AlertCircle, FileText } from 'lucide-react'
import Link from 'next/link'

type StripeInvoice = {
  id:         string
  number:     string | null
  date:       number
  amount:     number
  status:     string | null
  pdf_url:    string | null
  hosted_url: string | null
}

function statusLabel(status: string | null) {
  switch (status) {
    case 'paid':  return { text: 'Payée',      color: 'var(--rp-success)',   bg: 'var(--rp-success-bg)' }
    case 'open':  return { text: 'En attente', color: 'var(--rp-warning)',   bg: 'var(--rp-warning-bg)' }
    case 'void':  return { text: 'Annulée',    color: 'var(--rp-navy-muted)', bg: 'var(--rp-lavender-light)' }
    default:      return { text: status ?? '—', color: 'var(--rp-navy-muted)', bg: 'var(--rp-lavender-light)' }
  }
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<StripeInvoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stripe/invoices')
        if (!res.ok) throw new Error('Impossible de récupérer les factures.')
        const data = await res.json() as { invoices: StripeInvoice[] }
        setInvoices(data.invoices ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/parametres"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
          style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--rp-navy)', fontFamily: 'var(--font-display)' }}>
          Historique des factures
        </h1>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--rp-white)', borderColor: 'var(--rp-lavender-light)', boxShadow: 'var(--rp-shadow-card)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--rp-navy-muted)' }} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 m-6 p-3 rounded-xl text-sm font-medium" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 opacity-30" style={{ color: 'var(--rp-navy-muted)' }} />
            <div className="text-center">
              <p className="font-medium text-sm" style={{ color: 'var(--rp-navy)' }}>Aucune facture disponible</p>
              <p className="text-xs mt-1" style={{ color: 'var(--rp-navy-muted)' }}>
                Vos factures apparaîtront ici après votre premier paiement.
              </p>
            </div>
          </div>
        ) : (
          <>
            {invoices.map((inv, i) => {
              const s = statusLabel(inv.status)
              const isLast = i === invoices.length - 1
              return (
                <div key={inv.id}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--rp-lavender-light)' }}
                    >
                      <Receipt className="w-4 h-4" style={{ color: 'var(--rp-amber)' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: 'var(--rp-navy)' }}>
                          {inv.amount.toFixed(2).replace('.', ',')} €
                        </p>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {s.text}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
                        {formatDate(inv.date)}{inv.number ? ` · ${inv.number}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger le PDF"
                          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                          style={{ color: 'var(--rp-navy-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--rp-lavender-light)'; e.currentTarget.style.color = 'var(--rp-navy)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rp-navy-muted)' }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {inv.hosted_url && (
                        <a
                          href={inv.hosted_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir en ligne"
                          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                          style={{ color: 'var(--rp-navy-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--rp-lavender-light)'; e.currentTarget.style.color = 'var(--rp-navy)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rp-navy-muted)' }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {!isLast && <div className="h-px ml-5" style={{ background: 'var(--rp-lavender-light)' }} />}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
