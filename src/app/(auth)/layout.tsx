import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PilotResto — Connexion',
  description: 'Gérez votre restaurant avec PilotResto',
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
        <img src="/favicon.png" alt="PilotResto" style={{ height: '36px', width: 'auto' }} />
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PilotResto · Tous droits réservés ·{' '}
        <a href="/mentions-legales" className="hover:text-gray-600 transition-colors">
          Mentions légales
        </a>
      </footer>
    </div>
  )
}
