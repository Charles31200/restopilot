'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Upload, Loader2, AlertCircle, CheckCircle2, FileText, X, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { OCRResult, InvoiceExtended } from '@/types/comptabilite'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  supplier_name: z.string().optional(),
  invoice_date:  z.string().min(1, 'Date requise'),
  amount:        z.number().min(0, 'Montant HT requis'),
  vat_amount:    z.number().min(0),
  due_date:      z.string().optional(),
  status:        z.enum(['pending', 'validated', 'paid']).default('pending'),
})

type FormData = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────

const inputCls = (e?: boolean) => cn(
  'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
  e ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
)

function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// ── Props ─────────────────────────────────────────────────────

type InvoiceScannerProps = {
  onSaved: (invoice: InvoiceExtended) => void
}

// ── Composant ─────────────────────────────────────────────────

export function InvoiceScanner({ onSaved }: InvoiceScannerProps) {
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const [file,       setFile]   = useState<File | null>(null)
  const [isDragging, setDrag]   = useState(false)
  const [isScanning, setScanning] = useState(false)
  const [ocrResult,  setOCR]    = useState<OCRResult | null>(null)
  const [scanError,  setScanErr] = useState<string | null>(null)
  const [saved,      setSaved]  = useState(false)

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending' },
  })

  // ── Sélection / drop de fichier ──────────────────────────

  const handleFile = async (f: File) => {
    setFile(f)
    setScanErr(null)
    setOCR(null)
    setSaved(false)
    reset({ status: 'pending' })
  }

  // ── Lancer l'OCR ─────────────────────────────────────────

  const handleScan = async () => {
    if (!file) return
    setScanning(true)
    setScanErr(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res  = await fetch('/api/invoices/scan', { method: 'POST', body: formData })
      const json = await res.json() as OCRResult

      setOCR(json)

      // Pré-remplir le formulaire avec les résultats
      reset({
        supplier_name: json.supplier_name || '',
        invoice_date:  json.invoice_date  || '',
        amount:        json.amount_ht     || 0,
        vat_amount:    json.vat_amount    || 0,
        due_date:      json.due_date      || '',
        status:        'pending',
      })

      if (json.error) setScanErr(json.error)
    } catch {
      setScanErr('Impossible de contacter le serveur. Renseignez les champs manuellement.')
      reset({ status: 'pending' })
    } finally {
      setScanning(false)
    }
  }

  // ── Sauvegarder la facture ────────────────────────────────

  const onSubmit = async (data: FormData) => {
    const res  = await fetch('/api/invoices', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        supplier_name: data.supplier_name || null,
        amount:        data.amount,
        vat_amount:    data.vat_amount,
        invoice_date:  data.invoice_date || null,
        due_date:      data.due_date     || null,
        status:        data.status,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setScanErr(json.error ?? 'Erreur lors de l\'enregistrement.'); return }
    setSaved(true)
    onSaved(json.invoice)
    // Reset après 2s
    setTimeout(() => {
      setFile(null); setOCR(null); setSaved(false)
      reset({ status: 'pending' })
    }, 2000)
  }

  // ── Succès ────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-sm font-semibold text-green-700">Facture enregistrée !</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault(); setDrag(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-all',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Déposez votre facture ici
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WEBP ou PDF · Max 10 Mo
            </p>
          </div>
          <span className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-xl hover:bg-blue-50 transition-colors">
            Parcourir les fichiers
          </span>
          <input
            ref={fileInputRef} type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!ocrResult && (
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isScanning
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Analyse…</>
                  : <><Sparkles className="w-4 h-4" />Analyser avec l'IA</>
                }
              </button>
            )}
            {ocrResult && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Analysé</span>}
            <button onClick={() => { setFile(null); setOCR(null); setScanErr(null) }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alerte OCR */}
      {scanError && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{scanError}</p>
        </div>
      )}

      {/* Formulaire (affiché si un fichier est sélectionné) */}
      {file && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2">
              {ocrResult ? 'Champs détectés — vérifiez et corrigez si besoin' : 'Saisie manuelle'}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
              <input {...register('supplier_name')} placeholder="Métro, Pomona…" className={inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de facture *</label>
              <input type="date" {...register('invoice_date')} className={inputCls(!!errors.invoice_date)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'échéance</label>
              <input type="date" {...register('due_date')} className={inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant HT (€) *</label>
              <input type="number" step="0.01" min="0" {...register('amount', { valueAsNumber: true })} className={inputCls(!!errors.amount)} />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">TVA (€)</label>
              <input type="number" step="0.01" min="0" {...register('vat_amount', { valueAsNumber: true })} className={inputCls()} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select {...register('status')} className={inputCls()}>
                <option value="pending">En attente</option>
                <option value="validated">Validée</option>
                <option value="paid">Payée</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer la facture
          </button>
        </form>
      )}
    </div>
  )
}
