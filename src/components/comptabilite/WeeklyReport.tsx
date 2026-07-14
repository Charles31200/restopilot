'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Loader2, Send, AlertTriangle,
  CheckCircle2, TrendingUp, TrendingDown, ShoppingCart, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  getCurrentWeek, prevWeek, nextWeek, formatWeekLabel,
  dateToWeekString,
} from '@/lib/utils/week-utils'
import type { WeeklyReportData } from '@/types/comptabilite'

// ── Helpers ───────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

// ── Metric card ───────────────────────────────────────────────

function Metric({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon:  React.ElementType
  color: string
}) {
  return (
    <div className={cn('rounded-xl p-3 border', color)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 opacity-70" />
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

// ── Composant ─────────────────────────────────────────────────

export function WeeklyReport() {
  const [week,      setWeek]      = useState(getCurrentWeek())
  const [data,      setData]      = useState<WeeklyReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const currentWeek = getCurrentWeek()

  const fetchReport = useCallback(async (w: string) => {
    setIsLoading(true)
    setError(null)
    setEmailSent(false)
    try {
      const res  = await fetch(`/api/reports/weekly?week=${w}`)
      const json = await res.json()
      if (res.ok) setData(json)
      else setError(json.error ?? 'Erreur lors du chargement.')
    } catch {
      setError('Impossible de charger le rapport.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport(week) }, [week, fetchReport])

  const sendEmail = async () => {
    setIsSending(true)
    setEmailSent(false)
    setError(null)
    try {
      const res  = await fetch(`/api/reports/weekly?week=${week}`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.emailSent) {
        setEmailSent(true)
      } else {
        setError(json.emailError ?? json.error ?? 'Envoi impossible. Vérifiez la configuration email.')
      }
    } catch {
      setError('Erreur réseau lors de l\'envoi.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-white/8 p-5 space-y-4">
      {/* Titre + navigation */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Rapport hebdomadaire</h2>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeek(prevWeek(week))}
            className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/45" />
          </button>
          <span className="text-xs font-medium text-white/70 px-2 min-w-[160px] text-center">
            {formatWeekLabel(week)}
          </span>
          <button
            onClick={() => setWeek(nextWeek(week))}
            disabled={week >= currentWeek}
            className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/45" />
          </button>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 ml-1" />}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Données */}
      {data && !isLoading && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Metric
              label="CA semaine"
              value={fmt(data.revenue)}
              icon={TrendingUp}
              color="bg-[#7798AB]/15 text-[#8FADC0] border-[#7798AB]/25"
            />
            <Metric
              label="Marge brute"
              value={`${fmt(data.grossMargin)} (${data.grossMarginPct} %)`}
              icon={data.grossMarginPct > 20 ? TrendingUp : TrendingDown}
              color={cn(
                data.grossMargin >= 0
                  ? 'bg-green-500/10 text-green-800 border-green-500/20'
                  : 'bg-red-500/10 text-red-800 border-red-500/20'
              )}
            />
            <Metric
              label="Achats"
              value={fmt(data.purchases)}
              icon={ShoppingCart}
              color="bg-red-500/10 text-red-800 border-red-500/20"
            />
            <Metric
              label="Masse salariale"
              value={fmt(data.laborCost)}
              icon={Users}
              color="bg-amber-500/10 text-amber-800 border-amber-500/20"
            />
          </div>

          {/* Alertes */}
          {data.alerts.length > 0 ? (
            <div className="space-y-1.5">
              {data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <p>Aucune alerte cette semaine.</p>
            </div>
          )}

          {/* Bouton email */}
          <div className="pt-1">
            {emailSent ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Rapport envoyé par email
              </div>
            ) : (
              <button
                onClick={sendEmail}
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#7798AB] rounded-xl hover:bg-[#8FADC0] disabled:opacity-60 transition-colors w-full justify-center"
              >
                {isSending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                  : <><Send className="w-4 h-4" />Envoyer par email</>
                }
              </button>
            )}
          </div>
        </>
      )}

      {!data && !isLoading && !error && (
        <div className="py-8 text-center text-white/30 text-sm">
          Aucune donnée pour cette semaine.
        </div>
      )}
    </div>
  )
}
