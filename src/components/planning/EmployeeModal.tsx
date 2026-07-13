'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import type { Employee } from '@/types'

// ── Schéma ────────────────────────────────────────────────────

const schema = z.object({
  first_name:    z.string().min(1, 'Prénom requis'),
  last_name:     z.string().min(1, 'Nom requis'),
  role:          z.enum(['cuisinier', 'serveur', 'barman', 'plongeur', 'manager', 'autre']),
  contract_type: z.enum(['CDI', 'CDD', 'extra', 'apprenti']),
  hourly_rate:   z.number().min(0, 'Taux horaire requis'),
  weekly_hours:  z.number().int().min(1).max(48),
  color:         z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

type FormData = z.infer<typeof schema>

// ── Palettes ──────────────────────────────────────────────────

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#64748B', '#A16207', '#065F46',
]

const ROLE_LABELS: Record<string, string> = {
  cuisinier: 'Cuisinier·ère', serveur: 'Serveur·euse', barman: 'Barman / Barmaid',
  plongeur: 'Plongeur·euse', manager: 'Manager / Chef de rang', autre: 'Autre',
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', extra: 'Extra', apprenti: 'Apprenti',
}

// ── Helpers ───────────────────────────────────────────────────

const inputCls = (e?: boolean) => cn(
  'w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all outline-none',
  e ? 'border-red-400 bg-red-500/10 focus:ring-2 focus:ring-red-400/20'
    : 'border-white/10 focus:border-[#7798AB] focus:ring-2 focus:ring-[#7798AB]/20'
)

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}</p>
}

// ── Props ─────────────────────────────────────────────────────

type EmployeeModalProps = {
  employee?: Employee | null
  onClose:   () => void
  onSaved:   (emp: Employee) => void
}

// ── Composant ─────────────────────────────────────────────────

export function EmployeeModal({ employee, onClose, onSaved }: EmployeeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!employee?.id

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        first_name:    employee?.first_name    ?? '',
        last_name:     employee?.last_name     ?? '',
        role:          (employee?.role          ?? 'serveur') as FormData['role'],
        contract_type: (employee?.contract_type ?? 'CDI')     as FormData['contract_type'],
        hourly_rate:   employee?.hourly_rate   ?? 11.88,
        weekly_hours:  employee?.weekly_hours  ?? 35,
        color:         employee?.color         ?? '#3B82F6',
      },
    })

  const selectedColor = watch('color')

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...data, id: employee!.id } : data),
      })
      const json = await res.json()
      if (!res.ok) { setServerError(json.error ?? 'Erreur.'); return }
      onSaved(json.employee)
    } catch { setServerError('Erreur réseau.') }
  }

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-white/70 border border-white/10 rounded-xl hover:bg-white/5">
        Annuler
      </button>
      <button type="submit" form="employee-form" disabled={isSubmitting}
        className="px-5 py-2 text-sm font-medium text-white bg-[#7798AB] rounded-xl hover:bg-[#8FADC0] disabled:opacity-60 flex items-center gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? 'Enregistrer' : 'Créer l\'employé'}
      </button>
    </div>
  )

  return (
    <Modal title={isEdit ? `Modifier — ${employee!.first_name}` : 'Nouvel employé'} onClose={onClose} footer={footer}>
      {serverError && (
        <div className="mb-4 flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{serverError}
        </div>
      )}

      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Prénom *</label>
            <input {...register('first_name')} placeholder="Marie" className={inputCls(!!errors.first_name)} />
            <FieldError msg={errors.first_name?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Nom *</label>
            <input {...register('last_name')} placeholder="Dupont" className={inputCls(!!errors.last_name)} />
            <FieldError msg={errors.last_name?.message} />
          </div>
        </div>

        {/* Rôle */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">Rôle *</label>
          <select {...register('role')} className={inputCls(!!errors.role)}>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Contrat + Taux horaire + Heures hebdo */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Contrat *</label>
            <select {...register('contract_type')} className={inputCls()}>
              {Object.entries(CONTRACT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Taux horaire (€)</label>
            <input type="number" step="0.01" min="0" placeholder="11.88"
              {...register('hourly_rate', { valueAsNumber: true })} className={inputCls(!!errors.hourly_rate)} />
            <FieldError msg={errors.hourly_rate?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Heures / semaine</label>
            <input type="number" min="1" max="48" placeholder="35"
              {...register('weekly_hours', { valueAsNumber: true })} className={inputCls(!!errors.weekly_hours)} />
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Couleur du planning</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(color => (
              <button
                key={color} type="button"
                onClick={() => setValue('color', color)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                  selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Couleur ${color}`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-white/8" style={{ backgroundColor: selectedColor }} />
            <span className="text-xs text-white/45 font-mono">{selectedColor}</span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
