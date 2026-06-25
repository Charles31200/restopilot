import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PilotResto — Logiciel de gestion pour restaurateurs',
  description: 'Stocks, planning, comptabilité et ventes centralisés en un seul outil conçu pour les restaurateurs.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar minimaliste */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/favicon.png" alt="PilotResto" style={{ height: '36px', width: 'auto' }} />
          </a>
          <div className="flex items-center gap-6">
            <a href="/contact"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block">
              Contact
            </a>
            <a href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Connexion
            </a>
            <a href="/contact"
              className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors"
              style={{ background: '#D4952A' }}>
              Demander une démo
            </a>
          </div>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="PilotResto" style={{ height: '24px', width: 'auto' }} />
            <span className="text-sm text-gray-500">© 2026 PilotResto</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="/politique-de-confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</a>
            <a href="/cgu-cgv"                      className="hover:text-gray-600 transition-colors">CGU / CGV</a>
            <a href="mailto:charles.lecussan@gmail.com" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
