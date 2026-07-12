'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ModalProps = {
  title: string
  children: React.ReactNode
  onClose: () => void
  maxWidth?: 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl'
  /** Footer persistant (ex: boutons submit/annuler) */
  footer?: React.ReactNode
}

export function Modal({
  title,
  children,
  onClose,
  maxWidth = 'max-w-lg',
  footer,
}: ModalProps) {
  // Fermer sur Escape + bloquer le scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay sombre */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Carte modale */}
      <div
        className={cn(
          'relative rounded-2xl shadow-2xl w-full flex flex-col',
          'max-h-[90vh]',
          maxWidth
        )}
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2
            id="modal-title"
            className="text-base font-semibold"
            style={{ color: '#FFFFFF' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer persistant */}
        {footer && (
          <div className="flex-shrink-0 px-5 py-4 border-t rounded-b-2xl" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
