'use client'

import { useState } from 'react'
import { Users, TrendingUp, AlertTriangle, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { EmployeeWeeklyStats } from '@/types/planning'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
}

function fmtH(h: number) {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return min > 0 ? `${hrs}h${String(min).padStart(2, '0')}` : `${hrs}h`
}

// ── Props ─────────────────────────────────────────────────────

type WeeklySummaryProps = {
  weeklyStats: EmployeeWeeklyStats[]
  totalCost:   number
  weekRevenue: number | null
  weekLabel:   string
  onClose:     () => void
}

// ── Composant ─────────────────────────────────────────────────

export function WeeklySummary({
  weeklyStats, totalCost, weekRevenue, weekLabel, onClose,
}: WeeklySummaryProps) {
  const [isSending, setIsSending] = useState(false)
  const [sent,      setSent]      = useState(false)

  const laborPct = weekRevenue && weekRevenue > 0
    ? (totalCost / weekRevenue) * 100
    : null

  const handleNotify = async () => {
    setIsSending(true)
    // Simulation d'envoi (remplacer par un appel API réel)
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setIsSending(false)
  }

  // Employés avec heures sup
  const overtimeEmployees = weeklyStats.filter(s => s.overtime25 + s.overtime50 > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Récap de la semaine
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-500 uppercase tracking-wide mb-1">Total</p>
              <p className="text-xl font-bold text-blue-700 tabular-nums">{fmt(totalCost)}</p>
              <p className="text-xs text-blue-400">masse salariale</p>
            </div>
            <div className={cn(
              'rounded-xl p-3 text-center',
              laborPct === null ? 'bg-gray-50'
              : laborPct < 32 ? 'bg-green-50' : laborPct < 40 ? 'bg-amber-50' : 'bg-red-50'
            )}>
              <p className={cn(
                'text-xs uppercase tracking-wide mb-1',
                laborPct === null ? 'text-gray-400'
                : laborPct < 32 ? 'text-green-500' : laborPct < 40 ? 'text-amber-500' : 'text-red-500'
              )}>% du CA</p>
              <p className={cn(
                'text-xl font-bold tabular-nums',
                laborPct === null ? 'text-gray-400'
                : laborPct < 32 ? 'text-green-700' : laborPct < 40 ? 'text-amber-700' : 'text-red-700'
              )}>
                {laborPct !== null ? `${laborPct.toFixed(1)} %` : 'n/d'}
              </p>
              <p className="text-xs text-gray-400">
                {weekRevenue ? `CA : ${fmt(weekRevenue)}` : 'Aucune vente enregistrée'}
              </p>
            </div>
            <div className={cn(
              'rounded-xl p-3 text-center',
              overtimeEmployees.length > 0 ? 'bg-amber-50' : 'bg-green-50'
            )}>
              <p className={cn(
                'text-xs uppercase tracking-wide mb-1',
                overtimeEmployees.length > 0 ? 'text-amber-500' : 'text-green-500'
              )}>Heures sup</p>
              <p className={cn(
                'text-xl font-bold',
                overtimeEmployees.length > 0 ? 'text-amber-700' : 'text-green-700'
              )}>
                {overtimeEmployees.length}
              </p>
              <p className="text-xs text-gray-400">
                {overtimeEmployees.length > 0 ? 'employé(s) concerné(s)' : 'aucune cette semaine'}
              </p>
            </div>
          </div>

          {/* Alerte heures sup */}
          {overtimeEmployees.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Heures supplémentaires détectées</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {overtimeEmployees.map(s => `${s.employee.first_name} (${fmtH(s.overtime25 + s.overtime50)} sup)`).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Tableau employés */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Heures planifiées</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Heures sup</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Coût semaine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeklyStats.map(s => {
                  const otHours = s.overtime25 + s.overtime50
                  return (
                    <tr key={s.employee.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.employee.color }} />
                          <span className="font-medium text-gray-900">
                            {s.employee.first_name} {s.employee.last_name}
                          </span>
                          <span className="text-xs text-gray-400">{s.employee.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={cn(
                          'font-semibold',
                          s.plannedHours > 35 ? 'text-amber-600' : 'text-gray-800'
                        )}>
                          {fmtH(s.plannedHours)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {otHours > 0 ? (
                          <span className="text-amber-600 font-semibold">+{fmtH(otHours)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {fmt(s.weeklyCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">Total semaine</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{fmt(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {weeklyStats.reduce((s, x) => s + x.plannedHours, 0).toFixed(1)} h totales planifiées
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100">
              Fermer
            </button>
            <button
              onClick={handleNotify} disabled={isSending || sent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              {isSending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              {sent ? 'Notifié ✓' : 'Notifier les employés'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
