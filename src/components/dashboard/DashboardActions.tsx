'use client'

/**
 * DashboardActions — bouton "Saisir une vente" + SaleModal.
 *
 * Mobile  : FAB amber fixe au-dessus de la BottomNav
 * Desktop : bouton pill dans le header (rendu via `slot` prop dans la page parent)
 *
 * Après un enregistrement réussi → router.refresh() pour recharger les KPIs.
 */

import { useState }        from 'react'
import { useRouter }       from 'next/navigation'
import { PlusCircle }      from 'lucide-react'
import { FAB }             from '@/components/ui/FAB'
import { SaleModal }       from '@/components/dashboard/SaleModal'

export function DashboardActions() {
  const [open, setOpen] = useState(false)
  const router          = useRouter()

  function handleSaved() {
    router.refresh()   // recharge les Server Components sans perdre le state client
  }

  return (
    <>
      {/* ── Bouton desktop (caché sur mobile) ──────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex items-center gap-2 h-[40px] px-5 rounded-full text-[13px] font-semibold text-white transition active:scale-[0.98] hover:opacity-90"
        style={{ background: 'var(--rp-amber)', fontFamily: 'var(--font-display)' }}
      >
        <PlusCircle className="w-4 h-4" />
        Saisir une vente
      </button>

      {/* ── FAB mobile (caché sur desktop via lg:hidden dans FAB) ── */}
      <FAB
        onClick={() => setOpen(true)}
        label="Saisir une vente"
        bottom={88}
      />

      {/* ── Modal ──────────────────────────────────────────── */}
      {open && (
        <SaleModal
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
