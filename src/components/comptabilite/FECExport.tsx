'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Download, Send, Loader2,
  CheckCircle2, AlertTriangle, FileCode, Settings,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatMonthLabel } from '@/lib/utils/week-utils'
import { createClient } from '@/lib/supabase/client'

// ── Helpers ───────────────────────────────────────────────────

function currentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

// ── Composant ─────────────────────────────────────────────────

export function FECExport() {
  const supabase = useMemo(() => createClient(), [])

  const [month,          setMonth]          = useState(currentMonthStr())
  const [isSending,      setIsSending]      = useState(false)
  const [emailSent,      setEmailSent]      = useState(false)
  const [sentTo,         setSentTo]         = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [accountantEmail, setAccountantEmail] = useState<string | null>(null)
  const [loadingEmail,   setLoadingEmail]   = useState(true)

  const current = currentMonthStr()

  // Charge l'email comptable au montage
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingEmail(false); return }

      const { data: profile } = await supabase
        .from('profiles').select('restaurant_id').eq('id', user.id).single()
      if (!profile?.restaurant_id) { setLoadingEmail(false); return }

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('accountant_email')
        .eq('id', profile.restaurant_id)
        .single()

      const email = (restaurant as { accountant_email?: string | null } | null)?.accountant_email ?? null
      setAccountantEmail(email)
      setLoadingEmail(false)
    }
    load()
  }, [supabase])

  const downloadUrl = `/api/exports/fec?month=${month}`

  const sendToAccountant = async () => {
    setIsSending(true)
    setEmailSent(false)
    setSentTo(null)
    setError(null)
    try {
      const res  = await fetch(`/api/exports/fec?month=${month}`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.emailSent) {
        setEmailSent(true)
        setSentTo(json.recipient ?? null)
      } else {
        setError(json.error ?? 'Envoi impossible. Vérifiez la configuration email.')
      }
    } catch {
      setError('Erreur réseau lors de l\'envoi.')
    } finally {
      setIsSending(false)
    }
  }

  const hasAccountant = Boolean(accountantEmail)
  const canSend = hasAccountant && !isSending

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
      {/* Titre */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <FileCode className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Export pour l&apos;expert-comptable</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fichier FEC au format officiel DGFiP</p>
        </div>
      </div>

      {/* Sélecteur de mois */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-600">Période</p>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1 w-fit">
          <button
            onClick={() => { setMonth(prevMonth(month)); setEmailSent(false) }}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700 px-3 min-w-[140px] text-center capitalize">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => { setMonth(nextMonth(month)); setEmailSent(false) }}
            disabled={month >= current}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Info FEC */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5 text-xs text-purple-800 space-y-1">
        <p className="font-semibold">Contenu du fichier FEC</p>
        <ul className="space-y-0.5 text-purple-700 list-disc list-inside">
          <li>Journal VE (ventes journalières)</li>
          <li>Journal AC (achats fournisseurs)</li>
          <li>Format 16 colonnes pipe-séparé</li>
          <li>Encodage UTF-8, conforme article L13 AA LPF</li>
        </ul>
      </div>

      {/* Avertissement email comptable manquant */}
      {!loadingEmail && !hasAccountant && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="space-y-1.5">
            <p className="font-medium">Email comptable non configuré</p>
            <p>Renseignez l&apos;email de votre expert-comptable dans les paramètres pour activer cet envoi.</p>
            <Link
              href="/dashboard/parametres/restaurant"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Aller dans les paramètres du restaurant
            </Link>
          </div>
        </div>
      )}

      {/* Email comptable configuré */}
      {!loadingEmail && hasAccountant && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
          <Send className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span>Envoi vers <span className="font-semibold text-gray-800">{accountantEmail}</span></span>
        </div>
      )}

      {/* Erreur envoi */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Succès email */}
      {emailSent && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <p>Fichier FEC envoyé à <span className="font-semibold">{sentTo ?? 'votre comptable'}</span>.</p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex flex-col gap-2.5 pt-1">
        <a
          href={downloadUrl}
          download
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger le fichier FEC
        </a>

        <button
          onClick={sendToAccountant}
          disabled={!canSend}
          title={!hasAccountant ? "Configurez d'abord l'email de votre expert-comptable dans les paramètres" : undefined}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors',
            canSend
              ? 'text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
              : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          )}
        >
          {isSending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
            : <><Send className="w-4 h-4" />Envoyer à mon comptable</>
          }
        </button>
      </div>
    </div>
  )
}
