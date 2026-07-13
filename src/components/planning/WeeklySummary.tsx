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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1A1A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7798AB]" />
              Récap de la semaine
            </h2>
            <p className="text-xs text-white/30 mt-0.5">{weekLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:bg-white/5">✕</button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#7798AB]/15 rounded-xl p-3 text-center">
              <p className="text-xs text-[#7798AB] uppercase tracking-wide mb-1">Total</p>
              <p className="text-xl font-bold text-[#8FADC0] tabular-nums">{fmt(totalCost)}</p>
              <p className="text-xs text-[#8FADC0]">masse salariale</p>
            </div>
            <div className={cn(
              'rounded-xl p-3 text-center',
              laborPct === null ? 'bg-white/5'
              : laborPct < 32 ? 'bg-green-500/10' : laborPct < 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
            )}>
              <p className={cn(
                'text-xs uppercase tracking-wide mb-1',
                laborPct === null ? 'text-white/30'
                : laborPct < 32 ? 'text-green-500' : laborPct < 40 ? 'text-amber-500' : 'text-red-500'
              )}>% du CA</p>
              <p className={cn(
                'text-xl font-bold tabular-nums',
                laborPct === null ? 'text-white/30'
                : laborPct < 32 ? 'text-green-400' : laborPct < 40 ? 'text-amber-400' : 'text-red-400'
              )}>
                {laborPct !== null ? `${laborPct.toFixed(1)} %` : 'n/d'}
              </p>
              <p className="text-xs text-white/30">
                {weekRevenue ? `CA : ${fmt(weekRevenue)}` : 'Aucune vente enregistrée'}
              </p>
            </div>
            <div className={cn(
              'rounded-xl p-3 text-center',
              overtimeEmployees.length > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'
            )}>
              <p className={cn(
                'text-xs uppercase tracking-wide mb-1',
                overtimeEmployees.length > 0 ? 'text-amber-500' : 'text-green-500'
              )}>Heures sup</p>
              <p className={cn(
                'text-xl font-bold',
                overtimeEmployees.length > 0 ? 'text-amber-400' : 'text-green-400'
              )}>
                {overtimeEmployees.length}
              </p>
              <p className="text-xs text-white/30">
                {overtimeEmployees.length > 0 ? 'employé(s) concerné(s)' : 'aucune cette semaine'}
              </p>
            </div>
          </div>

          {/* Alerte heures sup */}
          {overtimeEmployees.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Heures supplémentaires détectées</p>
                <p className="text-xs text-amber-400 mt-0.5">
                  {overtimeEmployees.map(s => `${s.employee.first_name} (${fmtH(s.overtime25 + s.overtime50)} sup)`).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Tableau employés */}
          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/6">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-white/45 uppercase tracking-wider">Employé</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-white/45 uppercase tracking-wider">Heures planifiées</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-white/45 uppercase tracking-wider">Heures sup</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-white/45 uppercase tracking-wider">Coût semaine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {weeklyStats.map(s => {
                  const otHours = s.overtime25 + s.overtime50
                  return (
                    <tr key={s.employee.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.employee.color }} />
                          <span className="font-medium text-white">
                            {s.employee.first_name} {s.employee.last_name}
                          </span>
                          <span className="text-xs text-white/30">{s.employee.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={cn(
                          'font-semibold',
                          s.plannedHours > 35 ? 'text-amber-600' : 'text-white'
                        )}>
                          {fmtH(s.plannedHours)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {otHours > 0 ? (
                          <span className="text-amber-600 font-semibold">+{fmtH(otHours)}</span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-white">
                        {fmt(s.weeklyCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 border-t border-white/8">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-white/70">Total semaine</td>
                  <td className="px-4 py-3 text-right font-bold text-white tabular-nums">{fmt(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/6 bg-white/[0.03] rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-white/30">
            {weeklyStats.reduce((s, x) => s + x.plannedHours, 0).toFixed(1)} h totales planifiées
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/70 border border-white/10 rounded-xl hover:bg-white/5">
              Fermer
            </button>
            <button
              onClick={handleNotify} disabled={isSending || sent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7798AB] rounded-xl hover:bg-[#8FADC0] disabled:opacity-60"
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
