'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw, Loader2, LogOut, Mail } from 'lucide-react'

export default function SubscriptionExpiredPage() {
  const [loading, setLoading] = useState(false)

  const handleReactivate = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } finally {
      setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 max-w-md w-full p-8 space-y-6 text-center">
        {/* Icône */}
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Texte */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Abonnement suspendu</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Votre abonnement RestoPilot a expiré. Réactivez-le pour retrouver
            l&apos;accès à vos données et à toutes les fonctionnalités.
          </p>
        </div>

        {/* Encadré données sécurisées */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          🔒 Vos données sont sécurisées et conservées pendant <strong>90 jours</strong>.
          Elles seront disponibles dès la réactivation.
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleReactivate}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Chargement…</>
              : <><RefreshCw className="w-4 h-4" />Réactiver mon abonnement</>
            }
          </button>

          <a
            href="/pricing"
            className="w-full py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            Voir les tarifs
          </a>

          <div className="flex items-center gap-4 pt-1">
            <a
              href="mailto:hello@restopilot.fr"
              className="flex-1 py-2 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />Contacter le support
            </a>
            <form action="/api/auth/signout" method="POST" className="flex-1">
              <button
                type="submit"
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
