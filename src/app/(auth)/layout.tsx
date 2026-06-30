import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PilotResto',
  description: 'Gérez votre restaurant en 10 secondes',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#FFFFFF' }}
    >
      {/* Contenu centré */}
      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="pb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '40px', width: 'auto', marginBottom: '10px' }} />
          <span
            className="font-extrabold text-[20px]"
            style={{ color: '#111111', fontFamily: 'var(--font-display)' }}
          >
            PilotResto
          </span>
        </div>

        {children}
      </div>

      <p className="mt-8 text-[11px]" style={{ color: '#BBBBBB', fontFamily: 'var(--font-body)' }}>
        © 2026 PilotResto · Essai gratuit 14 jours
      </p>
    </div>
  )
}
