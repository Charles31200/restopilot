import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RestoPilot — Connexion',
  description: 'Gérez votre restaurant avec RestoPilot',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header minimal */}
      <header className="py-6 px-8">
        <div className="flex items-center gap-2.5">
          {/* Logo RP */}
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-bold text-sm tracking-tight select-none">
              RP
            </span>
          </div>
          <span className="text-gray-900 font-semibold text-lg">
            RestoPilot
          </span>
        </div>
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} RestoPilot · Tous droits réservés ·{' '}
        <a href="/mentions-legales" className="hover:text-gray-600 transition-colors">
          Mentions légales
        </a>
      </footer>
    </div>
  )
}
