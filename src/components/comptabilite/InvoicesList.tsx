'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Trash2, ExternalLink, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatMonthLabel } from '@/lib/utils/week-utils'
import type { InvoiceExtended } from '@/types/comptabilite'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

type StatusConfig = { label: string; cls: string }
const STATUS_MAP: Record<string, StatusConfig> = {
  pending:   { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  validated: { label: 'Validée',    cls: 'bg-blue-100   text-blue-700'  },
  paid:      { label: 'Payée',      cls: 'bg-green-100  text-green-700' },
}

// ── Props ─────────────────────────────────────────────────────

type InvoicesListProps = {
  /** Appelé quand une nouvelle facture est ajoutée depuis le scanner */
  newInvoice?: InvoiceExtended | null
}

// ── Composant ─────────────────────────────────────────────────

export function InvoicesList({ newInvoice }: InvoicesListProps) {
  const [month,     setMonth]     = useState(currentMonth())
  const [status,    setStatus]    = useState('')
  const [invoices,  setInvoices]  = useState<InvoiceExtended[]>([])
  const [totalHT,   setTotalHT]   = useState(0)
  const [totalVAT,  setTotalVAT]  = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchInvoices = useCallback(async (m: string, st: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ month: m })
      if (st) params.set('status', st)
      const res  = await fetch(`/api/invoices?${params}`)
      const json = await res.json()
      if (res.ok) {
        setInvoices(json.invoices ?? [])
        setTotalHT(json.totalHT ?? 0)
        setTotalVAT(json.totalVAT ?? 0)
      }
    } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchInvoices(month, status) }, [month, status, fetchInvoices])

  // Ajouter la nouvelle facture au top sans re-fetch
  useEffect(() => {
    if (newInvoice) setInvoices(prev => [newInvoice, ...prev.filter(i => i.id !== newInvoice.id)])
  }, [newInvoice])

  // ── Mise à jour du statut ─────────────────────────────────

  const updateStatus = async (id: string, newStatus: 'pending' | 'validated' | 'paid') => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i))
    }
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    if (res.ok) setInvoices(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sélecteur mois */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1">
          <button onClick={() => setMonth(prevMonth(month))} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700 px-2 min-w-[120px] text-center capitalize">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={month >= currentMonth()}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Filtre statut */}
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500"
        >
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validées</option>
          <option value="paid">Payées</option>
        </select>

        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {invoices.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">Aucune facture pour cette période.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Fournisseur', 'Date', 'Montant HT', 'TVA', 'Total TTC', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => {
                  const cfg = STATUS_MAP[inv.status] ?? STATUS_MAP.pending
                  return (
                    <tr key={inv.id} className="group hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {inv.supplier_name ?? <span className="text-gray-400 italic">Non renseigné</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {inv.invoice_date
                          ? new Date(inv.invoice_date).toLocaleDateString('fr-FR')
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{fmt(inv.amount)}</td>
                      <td className="px-4 py-3 tabular-nums text-gray-500">{fmt(inv.vat_amount)}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{fmt(inv.total_ttc)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide', cfg.cls)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Voir fichier */}
                          {inv.file_url && (
                            <a href={inv.file_url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {/* Marquer payée */}
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => updateStatus(inv.id, 'paid')}
                              title="Marquer comme payée"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {/* Valider */}
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(inv.id, 'validated')}
                              title="Valider"
                              className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              Valider
                            </button>
                          )}
                          {/* Supprimer */}
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totaux */}
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Total — {invoices.length} facture{invoices.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-bold">{fmt(totalHT)}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-gray-600">{fmt(totalVAT)}</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-gray-900">{fmt(totalHT + totalVAT)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
