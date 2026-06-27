import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PilotResto',
  description: 'Gérez votre restaurant en 10 secondes',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: '#0D1B1E' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[420px] rounded-[24px] overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,.45)' }}
      >
        {/* Logo */}
        <div className="pt-8 pb-2 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="PilotResto" style={{ height: '56px', width: 'auto' }} />
        </div>

        {/* Contenu */}
        <div className="px-8 pb-8 pt-4">
          {children}
        </div>
      </div>

      <p className="mt-5 text-[11px]" style={{ color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-body)' }}>
        © 2026 PilotResto · Essai gratuit 14 jours
      </p>
    </div>
  )
}
