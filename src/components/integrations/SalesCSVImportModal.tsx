'use client'

/**
 * SalesCSVImportModal
 *
 * Import CSV de ventes journalières depuis une caisse (Lightspeed, Zelty, L'Addition, etc.)
 * Flux : déposer → aperçu + mapping colonnes → confirmer (replace/skip) → résultat
 */

import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, FileText, Loader2, CheckCircle2,
  AlertTriangle, ChevronDown, ArrowRight, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  parseSalesCSV,
  detectSalesColumns,
  type SalesColumnMapping,
  type ParsedSaleRow,
} from '@/lib/integrations/sales-csv-parser'

// ── Types ─────────────────────────────────────────────────────

type Step = 'idle' | 'mapping' | 'preview' | 'confirm_dup' | 'importing' | 'done'

type ImportResult = {
  inserted: number
  replaced: number
  skipped:  number
  errors:   string[]
}

type Props = {
  onClose:   () => void
  onSuccess: (result: ImportResult) => void
}

// ── Helpers ───────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fileSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// ── Libellés des cibles ───────────────────────────────────────

const TARGET_LABELS: Record<keyof SalesColumnMapping, string> = {
  date:          'Date',
  total_revenue: 'Montant (€)',
  covers:        'Couverts',
}

const TARGET_REQUIRED: (keyof SalesColumnMapping)[] = ['date', 'total_revenue']

// ── Composant ─────────────────────────────────────────────────

export function SalesCSVImportModal({ onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [step,       setStep]       = useState<Step>('idle')
  const [file,       setFile]       = useState<File | null>(null)
  const [isDragging, setDragging]   = useState(false)
  const [headers,    setHeaders]    = useState<string[]>([])
  const [mapping,    setMapping]    = useState<SalesColumnMapping>({ date: null, total_revenue: null, covers: null })
  const [rows,       setRows]       = useState<ParsedSaleRow[]>([])
  const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([])
  const [parseSkipped, setParseSkipped] = useState(0)
  const [duplicates, setDuplicates] = useState(0)
  const [onDuplicate, setOnDuplicate] = useState<'replace' | 'skip'>('skip')
  const [result,     setResult]     = useState<ImportResult | null>(null)
  const [importing,  setImporting]  = useState(false)
  const [fileError,  setFileError]  = useState<string | null>(null)

  // ── Chargement fichier ────────────────────────────────────────

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setFileError(null)

    const buffer  = await f.arrayBuffer()
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    const content = decoded.includes('�')
      ? new TextDecoder('windows-1252', { fatal: false }).decode(buffer)
      : decoded

    // Parse initial avec mapping auto
    const autoMap  = detectSalesColumns(
      // extraire les en-têtes sans papaparse pour le mapping initial
      content.split(/\r?\n/)[0]?.split(/[,;|\t]/).map(h => h.replace(/^"|"$/g, '').trim()) ?? []
    )
    const hdrs = content.split(/\r?\n/)[0]?.split(/[,;|\t]/).map(h => h.replace(/^"|"$/g, '').trim()) ?? []
    setHeaders(hdrs)
    setMapping(autoMap)

    const parsed = parseSalesCSV(content, autoMap)
    setRows(parsed.rows)
    setParseErrors(parsed.errors)
    setParseSkipped(parsed.skipped)

    // Afficher directement l'étape mapping si mapping incomplet, sinon aperçu
    const needsMapping = !autoMap.date || !autoMap.total_revenue
    setStep(needsMapping ? 'mapping' : 'preview')
  }, [])

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv') && !f.type.includes('csv')) {
      setFileError('Fichier invalide — accepte uniquement les fichiers .csv')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError('Fichier trop volumineux (max 10 Mo)')
      return
    }
    loadFile(f)
  }

  // ── Re-parser avec le mapping actuel ─────────────────────────

  const reparse = useCallback(async (newMapping: SalesColumnMapping) => {
    if (!file) return
    const buffer  = await file.arrayBuffer()
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    const content = decoded.includes('�')
      ? new TextDecoder('windows-1252', { fatal: false }).decode(buffer)
      : decoded
    const parsed = parseSalesCSV(content, newMapping)
    setRows(parsed.rows)
    setParseErrors(parsed.errors)
    setParseSkipped(parsed.skipped)
  }, [file])

  const updateMapping = (target: keyof SalesColumnMapping, value: string) => {
    const newMap = { ...mapping, [target]: value || null }
    setMapping(newMap)
    reparse(newMap)
  }

  // ── Passer à l'aperçu après mapping manuel ────────────────────

  const goToPreview = () => {
    if (!mapping.date || !mapping.total_revenue) return
    setStep('preview')
  }

  // ── Import ────────────────────────────────────────────────────

  const startImport = async (dupStrategy: 'replace' | 'skip') => {
    if (!file || rows.length === 0) return
    setImporting(true)

    try {
      const res  = await fetch('/api/sales/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows, filename: file.name, onDuplicate: dupStrategy }),
      })
      const json = await res.json()

      if (!res.ok) {
        setFileError(json.error ?? 'Erreur lors de l\'import.')
        setStep('preview')
        return
      }

      const importResult: ImportResult = {
        inserted: json.inserted ?? 0,
        replaced: json.replaced ?? 0,
        skipped:  json.skipped  ?? 0,
        errors:   json.errors   ?? [],
      }
      setResult(importResult)
      setStep('done')
      onSuccess(importResult)
    } catch {
      setFileError('Erreur réseau.')
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  // ── Vérifier s'il y a des doublons potentiels ─────────────────

  const handleConfirmImport = () => {
    // Compte indicatif : on ne peut pas savoir côté client, on laisse l'API gérer
    // mais on propose quand même l'option replace/skip si > 0 lignes
    setDuplicates(rows.length)  // worst case — l'API saura
    setStep('confirm_dup')
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        style={{ border: '1px solid var(--rp-lavender-light)' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--rp-lavender-light)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--rp-amber-light)' }}
            >
              <Upload className="w-4 h-4" style={{ color: 'var(--rp-amber)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--rp-navy)' }}>
                Importer mes ventes CSV
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
                {step === 'idle'        && 'Lightspeed, Zelty, L\'Addition et autres caisses'}
                {step === 'mapping'     && `Associer les colonnes — ${file?.name}`}
                {step === 'preview'     && `${rows.length} journée${rows.length > 1 ? 's' : ''} détectée${rows.length > 1 ? 's' : ''} — ${file?.name}`}
                {step === 'confirm_dup' && 'Gestion des doublons'}
                {step === 'importing'   && 'Import en cours…'}
                {step === 'done'        && 'Import terminé'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--rp-navy-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Corps ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ─── ÉTAPE 1 : Drop zone ─── */}
          {step === 'idle' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all',
                  isDragging ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/20'
                )}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--rp-amber-light)' }}>
                  <Upload className="w-6 h-6" style={{ color: 'var(--rp-amber)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--rp-navy)' }}>Déposez votre export CSV ici</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--rp-navy-muted)' }}>Fichier .csv exporté depuis votre caisse · Max 10 Mo</p>
                </div>
                <span
                  className="px-4 py-2 text-sm font-medium rounded-xl border transition-colors"
                  style={{ color: 'var(--rp-amber-dark)', borderColor: 'var(--rp-amber)', background: 'var(--rp-amber-light)' }}
                >
                  Parcourir
                </span>
                <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {fileError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{fileError}
                </div>
              )}

              <div className="rounded-xl p-4 text-xs space-y-1" style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)' }}>
                <p className="font-semibold" style={{ color: 'var(--rp-navy)' }}>Formats acceptés</p>
                <p>• Colonnes reconnues automatiquement : <em>date / jour / CA / total / montant / couverts / clients…</em></p>
                <p>• Dates : JJ/MM/AAAA ou AAAA-MM-JJ</p>
                <p>• Montants : format français (12,50) ou anglais (12.50)</p>
              </div>
            </>
          )}

          {/* ─── ÉTAPE 2 : Mapping colonnes ─── */}
          {step === 'mapping' && (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--rp-lavender-light)' }}>
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rp-navy-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--rp-navy)' }}>{file?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--rp-navy-muted)' }}>{file ? fileSize(file.size) : ''} · {headers.length} colonnes</p>
                </div>
                <button onClick={() => { setFile(null); setStep('idle') }} className="p-1 rounded-lg hover:opacity-70">
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--rp-navy-muted)' }} />
                </button>
              </div>

              <div
                className="rounded-xl p-3 text-xs flex items-start gap-2"
                style={{ background: 'var(--rp-amber-light)', border: '1px solid var(--rp-amber)', color: 'var(--rp-amber-dark)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <p>Les colonnes n'ont pas pu être détectées automatiquement. Associez-les manuellement ci-dessous.</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--rp-navy-muted)' }}>
                  Association des colonnes
                </p>
                {(Object.keys(TARGET_LABELS) as (keyof SalesColumnMapping)[]).map(target => {
                  const required = TARGET_REQUIRED.includes(target)
                  const mapped   = mapping[target]
                  return (
                    <div key={target} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0 text-right">
                        <span className="text-xs font-medium" style={{ color: 'var(--rp-navy)' }}>
                          {TARGET_LABELS[target]}
                        </span>
                        {required && <span className="ml-1 text-xs" style={{ color: 'var(--rp-danger)' }}>*</span>}
                      </div>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rp-lavender)' }} />
                      <div className="flex-1 relative">
                        <select
                          value={mapped ?? ''}
                          onChange={e => updateMapping(target, e.target.value)}
                          className={cn(
                            'w-full appearance-none px-3 py-2 pr-8 rounded-xl border text-xs outline-none transition-all',
                            required && !mapped
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 focus:border-amber-400'
                          )}
                          style={{ color: 'var(--rp-navy)' }}
                        >
                          <option value="">— {required ? 'Requis' : 'Optionnel'} —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--rp-navy-muted)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {rows.length > 0 && (
                <p className="text-xs" style={{ color: 'var(--rp-navy-muted)' }}>
                  ✓ {rows.length} journée{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''} avec le mapping actuel
                </p>
              )}
            </>
          )}

          {/* ─── ÉTAPE 3 : Aperçu des données parsées ─── */}
          {step === 'preview' && (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--rp-lavender-light)' }}>
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--rp-navy-muted)' }} />
                <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--rp-navy)' }}>{file?.name}</p>
                <button
                  onClick={() => setStep('mapping')}
                  className="text-xs font-medium transition-colors hover:opacity-70"
                  style={{ color: 'var(--rp-amber-dark)' }}
                >
                  Modifier le mapping
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Journées',  value: rows.length,   color: 'var(--rp-navy)',   bg: 'var(--rp-lavender-light)' },
                  { label: 'CA total',  value: fmt(rows.reduce((s, r) => s + r.total_revenue, 0)), color: 'var(--rp-amber-dark)', bg: 'var(--rp-amber-light)' },
                  { label: 'Ignorées',  value: parseSkipped,  color: 'var(--rp-danger)',  bg: 'var(--rp-danger-bg)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color }}>
                      {label}
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Tableau aperçu */}
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--rp-lavender-light)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--rp-lavender-light)', borderBottom: '1px solid var(--rp-lavender)' }}>
                      {['Date', 'Montant (€)', 'Couverts'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--rp-navy-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--rp-lavender-light)' }}>
                        <td className="px-4 py-2.5 font-medium tabular-nums" style={{ color: 'var(--rp-navy)' }}>{fmtDate(row.date)}</td>
                        <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--rp-navy)' }}>{fmt(row.total_revenue)}</td>
                        <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--rp-navy-muted)' }}>
                          {row.covers != null ? row.covers : <span className="italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <p className="px-4 py-2 text-xs" style={{ color: 'var(--rp-navy-muted)', borderTop: '1px solid var(--rp-lavender-light)' }}>
                    … et {rows.length - 10} autre{rows.length - 10 > 1 ? 's' : ''} journée{rows.length - 10 > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Erreurs de parse */}
              {parseErrors.length > 0 && (
                <details className="text-xs rounded-xl p-3" style={{ background: 'var(--rp-danger-bg)', border: '1px solid var(--rp-danger)', color: 'var(--rp-danger)' }}>
                  <summary className="cursor-pointer font-semibold">
                    {parseErrors.length} ligne{parseErrors.length > 1 ? 's' : ''} ignorée{parseErrors.length > 1 ? 's' : ''} (cliquez pour voir)
                  </summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {parseErrors.slice(0, 8).map((e, i) => <li key={i}>{e.message}</li>)}
                    {parseErrors.length > 8 && <li>… et {parseErrors.length - 8} autres</li>}
                  </ul>
                </details>
              )}

              {fileError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{fileError}
                </div>
              )}
            </>
          )}

          {/* ─── ÉTAPE 4 : Gestion des doublons ─── */}
          {step === 'confirm_dup' && (
            <div className="space-y-4 py-2">
              <p className="text-sm" style={{ color: 'var(--rp-navy)' }}>
                Comment gérer les dates qui existent déjà dans la base ?
              </p>
              {(['skip', 'replace'] as const).map(opt => (
                <label
                  key={opt}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    onDuplicate === opt ? 'border-amber-400' : 'border-gray-200 hover:border-gray-300'
                  )}
                  style={onDuplicate === opt ? { background: 'var(--rp-amber-light)' } : {}}
                >
                  <input
                    type="radio"
                    name="duplicate"
                    value={opt}
                    checked={onDuplicate === opt}
                    onChange={() => setOnDuplicate(opt)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--rp-navy)' }}>
                      {opt === 'skip' ? 'Ignorer les doublons' : 'Remplacer les doublons'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--rp-navy-muted)' }}>
                      {opt === 'skip'
                        ? 'Les journées déjà présentes sont conservées — seules les nouvelles dates sont ajoutées.'
                        : 'Les journées déjà présentes sont mises à jour avec les valeurs du fichier CSV.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* ─── ÉTAPE 5 : Import en cours ─── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--rp-amber-light)' }}>
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--rp-amber)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--rp-navy)' }}>
                Import de {rows.length} journée{rows.length > 1 ? 's' : ''}…
              </p>
            </div>
          )}

          {/* ─── ÉTAPE 6 : Résultat ─── */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-base font-semibold" style={{ color: 'var(--rp-navy)' }}>Import réussi !</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Ajoutées',   value: result.inserted, color: 'green' },
                  { label: 'Remplacées', value: result.replaced,  color: 'blue'  },
                  { label: 'Ignorées',   value: result.skipped,   color: 'gray'  },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl p-3 text-center bg-${color}-50 border border-${color}-200`}>
                    <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                    <p className={`text-xs text-${color}-600 mt-0.5`}>{label}</p>
                  </div>
                ))}
              </div>

              {result.errors.length > 0 && (
                <details className="text-xs rounded-xl p-3" style={{ background: 'var(--rp-danger-bg)', color: 'var(--rp-danger)' }}>
                  <summary className="cursor-pointer font-semibold">
                    {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''} (cliquez pour voir)
                  </summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 10 && <li>… et {result.errors.length - 10} autres</li>}
                  </ul>
                </details>
              )}

              <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'var(--rp-lavender-light)', color: 'var(--rp-navy-muted)' }}>
                <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                Les ventes sont disponibles dans le tableau de bord et la comptabilité.
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div
          className="px-6 py-4 flex-shrink-0 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--rp-lavender-light)' }}
        >
          {step === 'done' ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-colors"
              style={{ background: 'var(--rp-amber)' }}
            >
              Fermer
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors hover:opacity-80"
                style={{ color: 'var(--rp-navy-muted)', borderColor: 'var(--rp-lavender)' }}
              >
                Annuler
              </button>

              {step === 'mapping' && (
                <button
                  onClick={goToPreview}
                  disabled={!mapping.date || !mapping.total_revenue}
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-40"
                  style={{ background: 'var(--rp-amber)' }}
                >
                  Voir l'aperçu →
                </button>
              )}

              {step === 'preview' && (
                <button
                  onClick={handleConfirmImport}
                  disabled={rows.length === 0}
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-40"
                  style={{ background: 'var(--rp-amber)' }}
                >
                  Importer {rows.length} journée{rows.length > 1 ? 's' : ''}
                </button>
              )}

              {step === 'confirm_dup' && (
                <button
                  onClick={() => { setStep('importing'); startImport(onDuplicate) }}
                  disabled={importing}
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--rp-amber)' }}
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmer l'import
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
