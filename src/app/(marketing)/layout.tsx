import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RestoPilot — Logiciel de gestion pour restaurateurs',
  description: 'Stocks, planning, comptabilité et ventes centralisés en un seul outil conçu pour les restaurateurs.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar minimaliste */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs select-none">RP</span>
            </div>
            <span className="font-semibold text-gray-900">RestoPilot</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Connexion
            </a>
            <a href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
              Essai gratuit
            </a>
          </div>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">RP</span>
            </div>
            <span className="text-sm text-gray-500">© 2026 RestoPilot</span>
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
