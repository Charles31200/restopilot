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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* Titre + navigation */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Rapport hebdomadaire</h2>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeek(prevWeek(week))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-xs font-medium text-gray-700 px-2 min-w-[160px] text-center">
            {formatWeekLabel(week)}
          </span>
          <button
            onClick={() => setWeek(nextWeek(week))}
            disabled={week >= currentWeek}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 ml-1" />}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
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
              color="bg-blue-50 text-blue-800 border-blue-200"
            />
            <Metric
              label="Marge brute"
              value={`${fmt(data.grossMargin)} (${data.grossMarginPct} %)`}
              icon={data.grossMarginPct > 20 ? TrendingUp : TrendingDown}
              color={cn(
                data.grossMargin >= 0
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              )}
            />
            <Metric
              label="Achats"
              value={fmt(data.purchases)}
              icon={ShoppingCart}
              color="bg-red-50 text-red-800 border-red-200"
            />
            <Metric
              label="Masse salariale"
              value={fmt(data.laborCost)}
              icon={Users}
              color="bg-amber-50 text-amber-800 border-amber-200"
            />
          </div>

          {/* Alertes */}
          {data.alerts.length > 0 ? (
            <div className="space-y-1.5">
              {data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs">
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
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors w-full justify-center"
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
        <div className="py-8 text-center text-gray-400 text-sm">
          Aucune donnée pour cette semaine.
        </div>
      )}
    </div>
  )
}
