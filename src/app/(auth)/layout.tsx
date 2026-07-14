import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PilotResto',
  description: 'Gérez votre restaurant en 10 secondes',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#0F0F0F' }}
    >
      {/* Contenu centré */}
      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="pb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '40px', width: 'auto', marginBottom: '10px' }} />
          <span
            className="font-extrabold text-[20px]"
            style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}
          >
            PilotResto
          </span>
        </div>

        <div
          className="rounded-[24px] p-6 sm:p-8"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {children}
        </div>
      </div>

      <p className="mt-8 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
        © 2026 PilotResto · Essai gratuit 14 jours
      </p>
    </div>
  )
}
