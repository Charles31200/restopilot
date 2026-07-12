'use client'

import { useState } from 'react'
import { Banknote, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function todayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

export function CashEntryCard() {
  const [open,    setOpen]    = useState(false)
  const [period,  setPeriod]  = useState<'day' | 'week'>('day')
  const [amount,  setAmount]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 0) {
      setError('Montant invalide.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/cash-entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date: todayISO(), amount: parsed, period }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? `Erreur ${res.status}`)
        return
      }
      setSuccess(true)
      setAmount('')
      setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
        style={{
          background:   '#1A1A1A',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding:      '10px 16px',
          color:        '#FFFFFF',
          fontFamily:   'var(--font-body)',
        }}
      >
        <Banknote className="w-4 h-4" style={{ color: '#7798AB' }} />
        + Déclarer des espèces
      </button>
    )
  }

  return (
    <div
      style={{
        background:   '#1A1A1A',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding:      '20px',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="flex items-center gap-2 text-[15px] font-semibold"
          style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}
        >
          <Banknote className="w-4 h-4" style={{ color: '#7798AB' }} />
          Espèces déclarées
        </h2>

        {/* Toggle jour / semaine */}
        <div
          className="inline-flex items-center gap-1 rounded-[10px] p-1"
          style={{ background: '#111111' }}
        >
          {(['day', 'week'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors"
              style={
                period === p
                  ? { background: '#7798AB', color: '#FFFFFF' }
                  : { color: 'rgba(255,255,255,0.45)' }
              }
            >
              {p === 'day' ? 'Jour' : 'Semaine'}
            </button>
          ))}
        </div>
      </div>

      {success ? (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: '#4ADE80' }}>
          <CheckCircle2 className="w-4 h-4" />
          Montant enregistré.
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={saving}
              className="w-full text-[15px] outline-none transition-colors"
              style={{
                background:   '#111111',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding:      '10px 36px 10px 14px',
                color:        '#FFFFFF',
                fontFamily:   'var(--font-body)',
              }}
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium select-none"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              €
            </span>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 mb-3 text-[12px]"
              style={{ color: '#F87171' }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="flex-1 py-2.5 text-[13px] font-medium rounded-[10px] transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !amount}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white rounded-[10px] transition-opacity disabled:opacity-50"
              style={{ background: '#7798AB', fontFamily: 'var(--font-display)' }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </>
      )}
    </div>
  )
}
