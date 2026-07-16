'use client'

import { useState } from 'react'
import { User, Building2, Briefcase, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const EMPLOYEE_ROLE_LABELS: Record<string, string> = {
  cuisinier: 'Cuisinier',
  serveur:   'Serveur',
  barman:    'Barman',
  plongeur:  'Plongeur',
  manager:   'Manager',
  autre:     'Autre',
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI:      'CDI',
  CDD:      'CDD',
  extra:    'Extra',
  apprenti: 'Apprenti',
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(119,152,171,0.12)', color: '#7798AB' }}>
        {icon}
      </div>
      <div>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        <p className="text-[14px] font-medium" style={{ color: '#FFFFFF' }}>{value}</p>
      </div>
    </div>
  )
}

function PasswordField({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-[8px] text-[14px] outline-none transition-colors duration-150 placeholder:text-[rgba(255,255,255,0.3)]"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '11px 44px 11px 14px',
          color: '#FFFFFF',
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export function EmployeeProfileClient({
  email,
  firstName,
  lastName,
  poste,
  contractType,
  restaurantName,
}: {
  email: string
  firstName: string
  lastName: string
  poste: string | null
  contractType: string | null
  restaurantName: string
}) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] p-5" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-[15px] font-semibold mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          {firstName} {lastName}
        </h2>
        <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>

        <InfoRow icon={<Building2 size={15} />} label="Restaurant" value={restaurantName} />
        {poste && (
          <InfoRow icon={<Briefcase size={15} />} label="Poste" value={EMPLOYEE_ROLE_LABELS[poste] ?? poste} />
        )}
        {contractType && (
          <InfoRow icon={<User size={15} />} label="Contrat" value={CONTRACT_LABELS[contractType] ?? contractType} />
        )}
      </div>

      <div className="rounded-[20px] p-5" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
          <Lock className="w-4 h-4" style={{ color: '#7798AB' }} />
          Changer mon mot de passe
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <PasswordField value={password} onChange={setPassword} placeholder="Nouveau mot de passe (min. 8 caractères)" />
          <PasswordField value={confirm} onChange={setConfirm} placeholder="Confirmer le mot de passe" />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-[10px] text-[13px]" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-[10px] text-[13px]" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Mot de passe mis à jour.
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !password || !confirm}
            className="w-full h-[42px] rounded-[8px] font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#7798AB', color: '#0F0F0F', fontFamily: 'var(--font-display)' }}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  )
}
