'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, FileText, ChevronRight, Loader2, CheckCircle2,
  AlertTriangle, Download, RefreshCw, Table,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  extractCSVHeaders,
  detectColumns,
  decodeBuffer,
  CSV_TEMPLATE,
} from '@/lib/integrations/csv-import'
import type { ColumnMapping } from '@/lib/integrations/csv-import'

// ── Colonnes requises et leur libellé ─────────────────────────

const REQUIRED_COLUMNS = ['date', 'dish_name', 'quantity', 'unit_price', 'total'] as const
const COLUMN_LABELS: Record<string, string> = {
  date:       'Date',
  dish_name:  'Nom du plat',
  quantity:   'Quantité',
  unit_price: 'Prix unitaire (€)',
  total:      'Total ligne (€)',
  time:       'Heure (optionnel)',
}

// ── Types ─────────────────────────────────────────────────────

type Step = 'idle' | 'preview' | 'mapping' | 'importing' | 'done'

type ImportResult = {
  imported:     number
  skipped:      number
  salesCreated: number
  stockUpdated: boolean
  errors:       string[]
}

type CSVImportModalProps = {
  onClose:   () => void
  onSuccess: (result: ImportResult) => void
}

// ── Helpers ───────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// ── Composant ─────────────────────────────────────────────────

export function CSVImportModal({ onClose, onSuccess }: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step,       setStep]       = useState<Step>('idle')
  const [file,       setFile]       = useState<File | null>(null)
  const [isDragging, setDragging]   = useState(false)
  const [headers,    setHeaders]    = useState<string[]>([])
  const [preview,    setPreview]    = useState<string[][]>([])
  const [mapping,    setMapping]    = useState<ColumnMapping>({})
  const [progress,   setProgress]   = useState(0)
  const [result,     setResult]     = useState<ImportResult | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  // ── Chargement du fichier ────────────────────────────────────

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setError(null)

    const buffer  = await f.arrayBuffer()
    const content = decodeBuffer(buffer)
    const hdrs    = extractCSVHeaders(content)
    const autoMap = detectColumns(hdrs)

    // Extraire les 5 premières lignes de données pour la prévisualisation
    const lines   = content.split(/\r?\n/).filter(l => l.trim())
    const rows    = lines.slice(1, 6).map(line =>
      line.split(/[,;|\t]/).map(c => c.replace(/^"|"$/g, '').trim())
    )

    setHeaders(hdrs)
    setPreview(rows)
    setMapping(autoMap)
    setStep('preview')
  }, [])

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv' && !f.type.includes('excel')) {
      setError('Fichier invalide — accepte uniquement les fichiers .csv')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5 Mo)')
      return
    }
    loadFile(f)
  }

  // ── Import ───────────────────────────────────────────────────

  const startImport = async () => {
    if (!file) return
    setStep('importing')
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      setProgress(30)
      const res  = await fetch('/api/sync/csv', { method: 'POST', body: formData })
      setProgress(80)

      const json = await res.json()
      setProgress(100)

      if (!res.ok && json.error) {
        setError(json.error)
        setStep('preview')
        return
      }

      const importResult: ImportResult = {
        imported:     json.imported     ?? 0,
        skipped:      json.skipped      ?? 0,
        salesCreated: json.salesCreated ?? 0,
        stockUpdated: json.stockUpdated ?? false,
        errors:       json.errors       ?? [],
      }

      setResult(importResult)
      setStep('done')
      onSuccess(importResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
      setStep('preview')
    }
  }

  // ── Télécharger le template ───────────────────────────────────

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'template-ventes-restopilot.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── UI ────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Table className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Import CSV</h2>
              <p className="text-xs text-gray-400">
                {step === 'idle'     && 'Importer vos ventes depuis un fichier CSV'}
                {step === 'preview'  && `Aperçu — ${file?.name}`}
                {step === 'mapping'  && 'Mapper les colonnes'}
                {step === 'importing' && 'Import en cours…'}
                {step === 'done'     && 'Import terminé'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ── ÉTAPE 1 : Drop zone ── */}
          {step === 'idle' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault(); setDragging(false)
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all',
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Déposez votre fichier CSV ici</p>
                  <p className="text-xs text-gray-400 mt-1">Fichier .csv · Max 5 Mo</p>
                </div>
                <span className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-xl">
                  Parcourir
                </span>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Pas encore de fichier ?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Téléchargez le template RestoPilot</p>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                  <Download className="w-3.5 h-3.5" />Template CSV
                </button>
              </div>
            </>
          )}

          {/* ── ÉTAPE 2 : Aperçu ── */}
          {step === 'preview' && (
            <>
              {/* Fichier sélectionné */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file?.name}</p>
                  <p className="text-xs text-gray-400">{file ? formatFileSize(file.size) : ''}</p>
                </div>
                <button onClick={() => { setFile(null); setStep('idle') }}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mapping des colonnes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Correspondance des colonnes
                </h3>
                <div className="space-y-2">
                  {Object.entries(COLUMN_LABELS).map(([target, label]) => {
                    const isRequired = REQUIRED_COLUMNS.includes(target as typeof REQUIRED_COLUMNS[number])
                    return (
                      <div key={target} className="flex items-center gap-3">
                        <div className="w-32 flex-shrink-0">
                          <span className="text-xs text-gray-600">{label}</span>
                          {isRequired && <span className="ml-1 text-red-400 text-xs">*</span>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <select
                          value={mapping[target] ?? ''}
                          onChange={e => setMapping(m => ({ ...m, [target]: e.target.value || undefined as unknown as string }))}
                          className={cn(
                            'flex-1 px-2.5 py-1.5 border rounded-lg text-xs outline-none focus:border-blue-500',
                            !mapping[target] && isRequired
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          )}
                        >
                          <option value="">— Non mappé —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Aperçu des données */}
              {preview.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Aperçu (5 premières lignes)
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[120px] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
            </>
          )}

          {/* ── ÉTAPE 3 : Import en cours ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700">Import en cours…</p>
              {/* Barre de progression */}
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{progress} %</p>
            </div>
          )}

          {/* ── ÉTAPE 4 : Résultat ── */}
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-base font-semibold text-gray-900">Import terminé !</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                  <p className="text-xs text-green-600 mt-0.5">lignes importées</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.salesCreated}</p>
                  <p className="text-xs text-blue-600 mt-0.5">journées créées</p>
                </div>
              </div>

              {result.skipped > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>{result.skipped} ligne{result.skipped > 1 ? 's' : ''} ignorée{result.skipped > 1 ? 's' : ''} (données invalides)</p>
                </div>
              )}

              {result.errors.length > 0 && (
                <details className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <summary className="cursor-pointer font-semibold">
                    {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''} (cliquez pour voir)
                  </summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 10 && <li>… et {result.errors.length - 10} autres</li>}
                  </ul>
                </details>
              )}

              {result.stockUpdated && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                  Stocks mis à jour automatiquement
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex items-center justify-between gap-3">
          {step === 'done' ? (
            <button onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors">
              Fermer
            </button>
          ) : (
            <>
              <button onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              {step === 'preview' && (
                <button
                  onClick={startImport}
                  disabled={REQUIRED_COLUMNS.some(c => !mapping[c])}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Importer les ventes
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
