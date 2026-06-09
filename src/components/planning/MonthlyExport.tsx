'use client'

import { useState, useCallback } from 'react'
import { Loader2, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatMonthLabel } from '@/lib/utils/week-utils'
import type { MonthlyPlanningData } from '@/types/planning'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
}

function fmtH(h: number) {
  return `${h.toFixed(1)} h`
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

function currentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── Props ─────────────────────────────────────────────────────

type MonthlyExportProps = {
  onClose: () => void
}

// ── Composant ─────────────────────────────────────────────────

export function MonthlyExport({ onClose }: MonthlyExportProps) {
  const [month,     setMonth]     = useState(currentMonthStr())
  const [data,      setData]      = useState<MonthlyPlanningData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = useCallback(async (m: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/planning/monthly-summary?month=${m}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur.'); return }
      setData(json)
    } catch { setError('Erreur réseau.') }
    finally { setIsLoading(false) }
  }, [])

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth)
    setData(null)
  }

  // ── Export PDF via fenêtre d'impression ──────────────────
  const handlePrint = () => {
    if (!data) return

    const rows = data.employeeStats.map(s => `
      <tr>
        <td>${s.employee.first_name} ${s.employee.last_name}</td>
        <td>${s.employee.role}</td>
        <td class="num">${fmtH(s.totalHours)}</td>
        <td class="num">${fmtH(s.normalHours)}</td>
        <td class="num ${s.overtime25 > 0 ? 'warn' : ''}">${s.overtime25 > 0 ? fmtH(s.overtime25) : '—'}</td>
        <td class="num ${s.overtime50 > 0 ? 'err' : ''}">${s.overtime50 > 0 ? fmtH(s.overtime50) : '—'}</td>
        <td class="num">${s.nightHours > 0 ? fmtH(s.nightHours) : '—'}</td>
        <td class="num">${s.sundayHours > 0 ? fmtH(s.sundayHours) : '—'}</td>
        <td class="num total">${fmt(s.estimatedGross)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Planning ${data.monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    p  { font-size: 11px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .total { font-weight: bold; }
    .warn { color: #b45309; }
    .err  { color: #b91c1c; }
    tfoot tr { background: #f0f0f0; font-weight: bold; }
    @page { margin: 1.5cm; }
  </style>
</head>
<body>
  <h1>Planning — ${data.monthLabel}</h1>
  <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · RestoPilot</p>
  <table>
    <thead>
      <tr>
        <th>Employé</th><th>Rôle</th>
        <th class="num">Total h</th>
        <th class="num">Normales</th>
        <th class="num">Sup 25 %</th>
        <th class="num">Sup 50 %</th>
        <th class="num">Nuit</th>
        <th class="num">Dimanche</th>
        <th class="num">Brut estimé</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="8">TOTAL</td>
        <td class="num">${fmt(data.totalCost)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) { alert('Autorisez les pop-ups pour exporter le PDF.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Export mensuel — comptable
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Sélecteur de mois */}
          <div className="flex items-center gap-4">
            <button onClick={() => handleMonthChange(prevMonth(month))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center capitalize">
              {formatMonthLabel(month)}
            </span>
            <button onClick={() => handleMonthChange(nextMonth(month))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchData(month)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Charger
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">Masse salariale</p>
                  <p className="text-xl font-bold text-blue-700 tabular-nums">{fmt(data.totalCost)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Employés</p>
                  <p className="text-xl font-bold text-gray-700">{data.employeeStats.length}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-400 uppercase tracking-wide mb-1">Avec heures sup</p>
                  <p className="text-xl font-bold text-amber-700">
                    {data.employeeStats.filter(s => s.overtime25 + s.overtime50 > 0).length}
                  </p>
                </div>
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Employé', 'Total h', 'Normales', 'Sup 25 %', 'Sup 50 %', 'Nuit', 'Dimanche', 'Majorations', 'Brut estimé'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.employeeStats.map(s => (
                      <tr key={s.employee.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{s.employee.first_name} {s.employee.last_name}</p>
                          <p className="text-xs text-gray-400">{s.employee.role}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{fmtH(s.totalHours)}</td>
                        <td className="px-3 py-3 text-gray-600 tabular-nums">{fmtH(s.normalHours)}</td>
                        <td className={cn('px-3 py-3 tabular-nums', s.overtime25 > 0 ? 'text-amber-600 font-semibold' : 'text-gray-300')}>
                          {s.overtime25 > 0 ? fmtH(s.overtime25) : '—'}
                        </td>
                        <td className={cn('px-3 py-3 tabular-nums', s.overtime50 > 0 ? 'text-red-600 font-semibold' : 'text-gray-300')}>
                          {s.overtime50 > 0 ? fmtH(s.overtime50) : '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-500 tabular-nums">
                          {s.nightHours > 0 ? fmtH(s.nightHours) : '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-500 tabular-nums">
                          {s.sundayHours > 0 ? fmtH(s.sundayHours) : '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-600 tabular-nums text-xs">
                          {s.nightBonus + s.sundayBonus + s.overtimeBonus > 0
                            ? fmt(s.nightBonus + s.sundayBonus + s.overtimeBonus)
                            : '—'
                          }
                        </td>
                        <td className="px-3 py-3 font-bold text-gray-900 tabular-nums">{fmt(s.estimatedGross)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-3 py-3 font-bold text-gray-900" colSpan={8}>Total {data.monthLabel}</td>
                      <td className="px-3 py-3 font-bold text-gray-900 tabular-nums">{fmt(data.totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <FileText className="w-10 h-10" />
              <p className="text-sm">Sélectionnez un mois et cliquez sur Charger.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100">
            Fermer
          </button>
          <button
            onClick={handlePrint} disabled={!data}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  )
}
